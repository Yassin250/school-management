// ============================================================
// Report Card Service
// ============================================================
// Gating, generation, and regeneration of report cards.
//
// See: docs/grade-workflow.md §20
// ============================================================

import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { logAudit } from "@/lib/audit/audit";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";

const ELIGIBLE_STATUSES = ["APPROVED", "LOCKED"] as const;
type EligibleStatus = (typeof ELIGIBLE_STATUSES)[number];

function isEligible(status: string): status is EligibleStatus {
  return ELIGIBLE_STATUSES.includes(status as EligibleStatus);
}

// ============================================================
// Gate check
// ============================================================

export interface ReportCardGateResult {
  canGenerate: boolean;
  blockingAssessments: Array<{
    assessmentId: string;
    title: string;
    status: string;
    subjectId: string | null;
    moduleId: string | null;
  }>;
}

export async function checkReportCardGate(
  studentId: string,
  termId: string,
): Promise<ReportCardGateResult> {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      status: "ACTIVE",
      academicYear: { terms: { some: { id: termId } } },
    },
    select: { id: true, classId: true, academicYearId: true },
  });

  if (!enrollment) {
    throw new NotFoundError(
      "Enrollment",
      `student ${studentId} in term ${termId}`,
    );
  }

  const assessments = await prisma.assessment.findMany({
    where: {
      termId,
      classId: enrollment.classId,
    },
    select: {
      id: true,
      title: true,
      status: true,
      subjectId: true,
      moduleId: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const blocking = assessments
    .filter((a) => !isEligible(a.status))
    .map((a) => ({
      assessmentId: a.id,
      title: a.title,
      status: a.status,
      subjectId: a.subjectId,
      moduleId: a.moduleId,
    }));

  return {
    canGenerate: blocking.length === 0,
    blockingAssessments: blocking,
  };
}

// ============================================================
// Generate report card
// ============================================================

export interface GenerateReportCardParams {
  studentId: string;
  termId: string;
  actor: CurrentUser;
  teacherComment?: string;
  principalComment?: string;
}

export async function generateReportCard(
  params: GenerateReportCardParams,
) {
  const {
    studentId,
    termId,
    actor,
    teacherComment,
    principalComment,
  } = params;

  const allowed = await canForUser(actor, "report_cards.generate", {
    type: "student",
    studentId,
  });
  if (!allowed) {
    throw new ForbiddenError("report_cards.generate");
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      status: "ACTIVE",
      academicYear: { terms: { some: { id: termId } } },
    },
    select: {
      id: true,
      classId: true,
      academicYearId: true,
      educationLevelId: true,
    },
  });

  if (!enrollment) {
    throw new NotFoundError(
      "Enrollment",
      `student ${studentId} in term ${termId}`,
    );
  }

  const gate = await checkReportCardGate(studentId, termId);
  if (!gate.canGenerate) {
    throw new ConflictError(
      `Cannot generate report card: ${gate.blockingAssessments.length} ` +
        `assessment(s) are not yet APPROVED or LOCKED.`,
      { blocking: gate.blockingAssessments },
    );
  }

  const assessments = await prisma.assessment.findMany({
    where: {
      termId,
      classId: enrollment.classId,
    },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      module: { select: { id: true, name: true, code: true } },
      results: {
        where: { studentId },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const buckets = new Map<
    string,
    {
      subjectId: string | null;
      moduleId: string | null;
      label: string;
      weightedScore: number;
      weightedMax: number;
    }
  >();

  for (const a of assessments) {
    const key = a.subjectId
      ? `subject:${a.subjectId}`
      : a.moduleId
        ? `module:${a.moduleId}`
        : `other:${a.id}`;

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        subjectId: a.subjectId,
        moduleId: a.moduleId,
        label: a.subject?.name ?? a.module?.name ?? "Unknown",
        weightedScore: 0,
        weightedMax: 0,
      };
      buckets.set(key, bucket);
    }

    const result = a.results[0];
    if (!result || result.isAbsent || result.score === null) continue;

    const weight = a.weight ? Number(a.weight.toString()) : 1;
    const maxScore = Number(a.maxScore.toString());
    const score = Number(result.score.toString());

    bucket.weightedScore += (score / maxScore) * weight;
    bucket.weightedMax += weight;
  }

  let totalScore = 0;
  const items: Array<{
    subjectId: string | null;
    moduleId: string | null;
    score: number;
    maxScore: number;
    grade: string | null;
  }> = [];

  for (const bucket of buckets.values()) {
    if (bucket.weightedMax === 0) continue;

    const percentage = (bucket.weightedScore / bucket.weightedMax) * 100;
    const rounded = Math.round(percentage * 100) / 100;

    totalScore += rounded;

    items.push({
      subjectId: bucket.subjectId,
      moduleId: bucket.moduleId,
      score: rounded,
      maxScore: 100,
      grade: null,
    });
  }

  const averageScore =
    items.length > 0
      ? Math.round((totalScore / items.length) * 100) / 100
      : 0;

  const gradeScale = await prisma.gradeScale.findFirst({
    where: { isActive: true },
    include: { items: true },
  });

  const gradeForScore = (score: number): string | null => {
    if (!gradeScale) return null;
    const match = gradeScale.items.find(
      (g) =>
        score >= Number(g.minScore.toString()) &&
        score <= Number(g.maxScore.toString()),
    );
    return match?.symbol ?? null;
  };

  for (const item of items) {
    item.grade = gradeForScore(item.score);
  }

  const attendance = await prisma.attendance.findMany({
    where: {
      studentId,
      lesson: {
        termId,
        classId: enrollment.classId,
      },
    },
    select: { status: true },
  });

  const attendanceSummary = {
    present: attendance.filter((a) => a.status === "PRESENT").length,
    absent: attendance.filter((a) => a.status === "ABSENT").length,
    late: attendance.filter((a) => a.status === "LATE").length,
    excused: attendance.filter((a) => a.status === "EXCUSED").length,
  };

  const referenceCode = generateReferenceCode(
    enrollment.academicYearId,
    termId,
    studentId,
  );

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.reportCard.findUnique({
      where: { studentId_termId: { studentId, termId } },
    });

    if (existing && !["DRAFT", "GENERATED"].includes(existing.status)) {
      throw new ConflictError(
        `Cannot regenerate report card in state ${existing.status}. ` +
          `Only DRAFT or GENERATED report cards can be regenerated.`,
      );
    }

    const reportCard = existing
      ? await tx.reportCard.update({
          where: { id: existing.id },
          data: {
            status: "GENERATED",
            averageScore,
            totalScore,
            teacherComment: teacherComment ?? existing.teacherComment,
            principalComment:
              principalComment ?? existing.principalComment,
            attendancePresent: attendanceSummary.present,
            attendanceAbsent: attendanceSummary.absent,
            attendanceLate: attendanceSummary.late,
            attendanceExcused: attendanceSummary.excused,
            generatedAt: now,
            referenceCode,
            needsRegeneration: false,
            regenerationReason: null,
          },
        })
      : await tx.reportCard.create({
          data: {
            studentId,
            termId,
            classId: enrollment.classId,
            academicYearId: enrollment.academicYearId,
            status: "GENERATED",
            averageScore,
            totalScore,
            teacherComment: teacherComment ?? null,
            principalComment: principalComment ?? null,
            attendancePresent: attendanceSummary.present,
            attendanceAbsent: attendanceSummary.absent,
            attendanceLate: attendanceSummary.late,
            attendanceExcused: attendanceSummary.excused,
            generatedAt: now,
            referenceCode,
          },
        });

    await tx.reportCardItem.deleteMany({
      where: { reportCardId: reportCard.id },
    });

    for (const item of items) {
      await tx.reportCardItem.create({
        data: {
          reportCardId: reportCard.id,
          subjectId: item.subjectId,
          moduleId: item.moduleId,
          score: item.score,
          maxScore: item.maxScore,
          grade: item.grade,
        },
      });
    }

    await logAudit({
      actorId: actor.id,
      action: "REPORT_CARD_GENERATED",
      entity: "ReportCard",
      entityId: reportCard.id,
      previousValue: existing
        ? {
            status: existing.status,
            averageScore: existing.averageScore?.toString() ?? null,
          }
        : null,
      newValue: {
        status: "GENERATED",
        averageScore,
        totalScore,
        itemCount: items.length,
        referenceCode,
      },
      tx,
    });

    return reportCard;
  });
}

// ============================================================
// Approve / publish
// ============================================================

export async function approveReportCard(
  reportCardId: string,
  actor: CurrentUser,
) {
  const allowed = await canForUser(actor, "report_cards.approve", {
    type: "report_card",
    reportCardId,
  });
  if (!allowed) {
    throw new ForbiddenError("report_cards.approve");
  }

  const reportCard = await prisma.reportCard.findUnique({
    where: { id: reportCardId },
  });
  if (!reportCard) {
    throw new NotFoundError("ReportCard", reportCardId);
  }
  if (reportCard.status !== "GENERATED") {
    throw new ConflictError(
      `Cannot approve report card in state ${reportCard.status}. ` +
        `Only GENERATED report cards can be approved.`,
    );
  }

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const updated = await tx.reportCard.update({
      where: { id: reportCardId },
      data: {
        status: "APPROVED",
        approvedAt: now,
        approvedById: actor.id,
      },
    });

    await logAudit({
      actorId: actor.id,
      action: "REPORT_CARD_APPROVED",
      entity: "ReportCard",
      entityId: reportCardId,
      previousValue: { status: "GENERATED" },
      newValue: { status: "APPROVED" },
      tx,
    });

    return updated;
  });
}

export async function publishReportCard(
  reportCardId: string,
  actor: CurrentUser,
) {
  const allowed = await canForUser(actor, "report_cards.publish", {
    type: "report_card",
    reportCardId,
  });
  if (!allowed) {
    throw new ForbiddenError("report_cards.publish");
  }

  const reportCard = await prisma.reportCard.findUnique({
    where: { id: reportCardId },
  });
  if (!reportCard) {
    throw new NotFoundError("ReportCard", reportCardId);
  }
  if (reportCard.status !== "APPROVED") {
    throw new ConflictError(
      `Cannot publish report card in state ${reportCard.status}. ` +
        `Only APPROVED report cards can be published.`,
    );
  }

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const updated = await tx.reportCard.update({
      where: { id: reportCardId },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
      },
    });

    await logAudit({
      actorId: actor.id,
      action: "REPORT_CARD_PUBLISHED",
      entity: "ReportCard",
      entityId: reportCardId,
      previousValue: { status: "APPROVED" },
      newValue: { status: "PUBLISHED" },
      tx,
    });

    return updated;
  });
}

// ============================================================
// Regeneration flag
// ============================================================

export async function markReportCardForRegeneration(
  studentId: string,
  termId: string,
  reason: string,
): Promise<void> {
  const reportCard = await prisma.reportCard.findUnique({
    where: { studentId_termId: { studentId, termId } },
  });
  if (!reportCard) return;
  if (!["APPROVED", "PUBLISHED"].includes(reportCard.status)) return;

  await prisma.reportCard.update({
    where: { id: reportCard.id },
    data: {
      needsRegeneration: true,
      regenerationReason: reason,
    },
  });
}

// ============================================================
// Reference code generator
// ============================================================

function generateReferenceCode(
  academicYearId: string,
  termId: string,
  studentId: string,
): string {
  const yearSuffix = academicYearId.slice(-4);
  const termSuffix = termId.slice(-3);
  const studentSuffix = studentId.slice(-4);
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RC-${yearSuffix}-${termSuffix}-${studentSuffix}-${random}`;
}