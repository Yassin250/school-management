// ============================================================
// Report Card Service
// ============================================================
// Gating, generation, and regeneration of report cards.
//
// See: docs/grade-workflow.md Section20
// ============================================================

import type { EducationArea } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { logAudit } from "@/lib/audit/audit";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";

const ELIGIBLE_STATUSES = ["APPROVED", "LOCKED"] as const;
type EligibleStatus = (typeof ELIGIBLE_STATUSES)[number];

function isEligible(status: string): status is EligibleStatus {
  return ELIGIBLE_STATUSES.includes(status as EligibleStatus);
}

// ------------------------------------------------------------
// Rewritability guard
// ------------------------------------------------------------

/**
 * A report card may be rewritten when it is still DRAFT/GENERATED, or when
 * an authorised actor has explicitly flagged it for regeneration.
 *
 * An APPROVED or PUBLISHED card without the flag is final: rewriting it
 * would silently change an academic record that has already been approved
 * and possibly issued to families. The flag is therefore the authorisation
 * token that re-opens it, and regenerating a flagged card returns it to
 * GENERATED so it must be re-approved and re-published.
 */
function isRewritable(card: {
  status: string;
  needsRegeneration?: boolean;
}): boolean {
  if (card.status === "DRAFT" || card.status === "GENERATED") return true;
  return card.needsRegeneration === true;
}

function describeRewriteBlock(status: string): string {
  if (status === "APPROVED" || status === "PUBLISHED") {
    return (
      `Cannot regenerate report card in state ${status}. ` +
      `It must first be flagged for regeneration by an authorised ` +
      `School Administrator.`
    );
  }
  return `Cannot regenerate report card in state ${status}.`;
}

// ============================================================
// Grade scale resolution
// ============================================================

interface ResolvedGradeBand {
  symbol: string;
  minScore: number;
  maxScore: number;
}

interface ResolvedGradeScale {
  id: string;
  name: string;
  educationArea: EducationArea;
  bands: ResolvedGradeBand[];
}

/**
 * Resolve the grading scale that applies to an education area.
 *
 * A student is graded against the scale configured for their own
 * education area — TVET competency grading must never be replaced by
 * a general A–F scale. Selection is deterministic (oldest active scale
 * first) and refuses to guess: a missing or ambiguous scale is a
 * configuration error that stops generation rather than silently
 * producing wrong grades.
 */
async function resolveActiveGradeScale(
  area: EducationArea,
): Promise<ResolvedGradeScale> {
  const scales = await prisma.gradeScale.findMany({
    where: { educationArea: area, isActive: true },
    select: {
      id: true,
      name: true,
      educationArea: true,
      createdAt: true,
      items: {
        select: {
          symbol: true,
          minScore: true,
          maxScore: true,
          order: true,
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (scales.length === 0) {
    throw new ValidationError(
      `No active grade scale is configured for ${area} education. ` +
        `A School Administrator must configure one before report cards can be generated.`,
      [
        {
          path: "gradeScale",
          message: `missing active ${area} grade scale`,
        },
      ],
    );
  }

  if (scales.length > 1) {
    throw new ValidationError(
      `${scales.length} active grade scales are configured for ${area} ` +
        `education (${scales.map((s) => s.name).join(", ")}). ` +
        `Archive all but one before generating report cards.`,
      [
        {
          path: "gradeScale",
          message: `ambiguous ${area} grade scale`,
        },
      ],
    );
  }

  const scale = scales[0];

  return {
    id: scale.id,
    name: scale.name,
    educationArea: scale.educationArea,
    bands: scale.items.map((item) => ({
      symbol: item.symbol,
      minScore: Number(item.minScore.toString()),
      maxScore: Number(item.maxScore.toString()),
    })),
  };
}

/**
 * Map a percentage to a grade symbol using the resolved scale's bands.
 * Band bounds are inclusive, matching the original behaviour.
 */
function createGradeMapper(scale: ResolvedGradeScale) {
  return (score: number): string | null => {
    const band = scale.bands.find(
      (b) => score >= b.minScore && score <= b.maxScore,
    );
    return band?.symbol ?? null;
  };
}

// ============================================================
// Reference code helpers
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

/**
 * Prisma unique-constraint violation. Used to retry reference-code
 * minting when a randomly generated code collides with an existing row.
 */
function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

/** How many times a colliding reference code may be re-minted. */
const REFERENCE_CODE_ATTEMPTS = 3;

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
      educationLevel: { select: { area: true, code: true } },
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

  // Grade against the scale configured for this student's education area.
  // Resolved before any write so a missing or ambiguous scale cannot
  // leave a half-written report card behind.
  const gradeScale = await resolveActiveGradeScale(
    enrollment.educationLevel.area,
  );
  const gradeForScore = createGradeMapper(gradeScale);

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

  const now = new Date();

  // A report card keeps its reference code for its entire life. Minting a
  // new one on regeneration would orphan any document already issued to
  // the student, so the code is only generated when none exists yet.
  const existing = await prisma.reportCard.findUnique({
    where: { studentId_termId: { studentId, termId } },
    select: {
      id: true,
      status: true,
      referenceCode: true,
      averageScore: true,
      needsRegeneration: true,
    },
  });

  if (existing && !isRewritable(existing)) {
    throw new ConflictError(describeRewriteBlock(existing.status));
  }

  const preservedReferenceCode = existing?.referenceCode ?? null;

  const writeReportCard = async (referenceCode: string) =>
    prisma.$transaction(async (tx) => {
      // Re-read inside the transaction: a concurrent generation for the
      // same (student, term) must not produce a second row, and a card
      // approved in the meantime must not be overwritten.
      const current = await tx.reportCard.findUnique({
        where: { studentId_termId: { studentId, termId } },
        select: {
          id: true,
          status: true,
          referenceCode: true,
          averageScore: true,
          needsRegeneration: true,
        },
      });

      if (current && !isRewritable(current)) {
        throw new ConflictError(describeRewriteBlock(current.status));
      }

      const code = current?.referenceCode ?? referenceCode;

      // A flagged card is being re-opened after a correction. It returns to
      // GENERATED and loses its approval/publication, so it must go through
      // approval again before families see the corrected grades.
      const wasFlagged = current?.needsRegeneration === true;

      const reportCard = await tx.reportCard.upsert({
        where: { studentId_termId: { studentId, termId } },
        create: {
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
          referenceCode: code,
        },
        update: {
          status: "GENERATED",
          averageScore,
          totalScore,
          teacherComment: teacherComment ?? undefined,
          principalComment: principalComment ?? undefined,
          attendancePresent: attendanceSummary.present,
          attendanceAbsent: attendanceSummary.absent,
          attendanceLate: attendanceSummary.late,
          attendanceExcused: attendanceSummary.excused,
          generatedAt: now,
          referenceCode: code,
          needsRegeneration: false,
          regenerationReason: null,
          approvedAt: null,
          approvedById: null,
          publishedAt: null,
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
        action: wasFlagged ? "REPORT_CARD_REGENERATED" : "REPORT_CARD_GENERATED",
        entity: "ReportCard",
        entityId: reportCard.id,
        description: wasFlagged
          ? `Regenerated report card after correction (${code})`
          : `Generated report card (${code})`,
        previousValue: current
          ? {
              status: current.status,
              averageScore: current.averageScore?.toString() ?? null,
              needsRegeneration: current.needsRegeneration,
              referenceCode: current.referenceCode,
            }
          : null,
        newValue: {
          status: "GENERATED",
          averageScore,
          totalScore,
          itemCount: items.length,
          referenceCode: code,
          gradeScaleId: gradeScale.id,
          ...(wasFlagged ? { reOpenedAfterCorrection: true } : {}),
        },
        tx,
      });

      return reportCard;
    });

  // Retry only when a freshly minted code collides with an existing row.
  // Preserved codes are stable and never trigger a retry.
  if (preservedReferenceCode) {
    return writeReportCard(preservedReferenceCode);
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < REFERENCE_CODE_ATTEMPTS; attempt++) {
    try {
      return await writeReportCard(
        generateReferenceCode(
          enrollment.academicYearId,
          termId,
          studentId,
        ),
      );
    } catch (error) {
      if (!isUniqueConstraintViolation(error) || attempt === REFERENCE_CODE_ATTEMPTS - 1) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError;
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

/**
 * Flag an already-approved/published report card as stale so it is
 * regenerated instead of silently remaining the official record.
 *
 * This is the authorisation token that lets `generateReportCard` re-open
 * a finalised card. Requires `report_cards.regenerate` and scope access to
 * the student, so flagging stays a School Administrator responsibility
 * even when the underlying correction was authorised by a Principal.
 *
 * Idempotent: flagging twice with the same reason is a no-op, and a card
 * that is not APPROVED/PUBLISHED is left untouched.
 */
export async function markReportCardForRegeneration(params: {
  studentId: string;
  termId: string;
  reason: string;
  actor: CurrentUser;
}): Promise<boolean> {
  const { studentId, termId, reason, actor } = params;

  const trimmedReason = reason?.trim();
  if (!trimmedReason) {
    throw new ValidationError("A regeneration reason is required.");
  }

  const allowed = await canForUser(actor, "report_cards.regenerate", {
    type: "student",
    studentId,
  });
  if (!allowed) {
    throw new ForbiddenError("report_cards.regenerate");
  }

  const reportCard = await prisma.reportCard.findUnique({
    where: { studentId_termId: { studentId, termId } },
    select: {
      id: true,
      status: true,
      needsRegeneration: true,
      regenerationReason: true,
    },
  });

  // No report card means nothing to flag. Never invent a requirement.
  if (!reportCard) return false;
  if (!["APPROVED", "PUBLISHED"].includes(reportCard.status)) return false;

  // Already flagged with the same reason: nothing to change, no new audit row.
  if (
    reportCard.needsRegeneration &&
    reportCard.regenerationReason === trimmedReason
  ) {
    return false;
  }

  await prisma.reportCard.update({
    where: { id: reportCard.id },
    data: {
      needsRegeneration: true,
      regenerationReason: trimmedReason,
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "REPORT_CARD_REGENERATED",
    entity: "ReportCard",
    entityId: reportCard.id,
    description: `Flagged report card for regeneration: ${trimmedReason}`,
    previousValue: {
      needsRegeneration: reportCard.needsRegeneration,
      regenerationReason: reportCard.regenerationReason,
      status: reportCard.status,
    },
    newValue: {
      needsRegeneration: true,
      regenerationReason: trimmedReason,
      status: reportCard.status,
    },
  });

  return true;
}

// ============================================================
// Regeneration queue
// ============================================================
// The work list a School Administrator uses to re-issue report cards
// after a correction. Two independent reasons put a card on it:
//
//   1. `needsRegeneration` was set explicitly, or
//   2. the card is stale — some assessment in its class/term is no longer
//      APPROVED or LOCKED, so the gate would refuse to generate it.
//
// Reading the queue requires `report_cards.regenerate` rather than
// `report_cards.read`: parents and students also hold the latter, and must
// not be able to enumerate other families' report cards.

export interface RegenerationQueueItem {
  reportCardId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  termId: string;
  termName: string;
  className: string;
  status: string;
  referenceCode: string | null;
  needsRegeneration: boolean;
  regenerationReason: string | null;
  /** True when the card's grades are behind the current assessment results. */
  stale: boolean;
  blockingAssessments: Array<{
    assessmentId: string;
    title: string;
    status: string;
  }>;
}

export async function listReportCardsRequiringRegeneration(
  actor: CurrentUser,
): Promise<RegenerationQueueItem[]> {
  const allowed = await canForUser(actor, "report_cards.regenerate");
  if (!allowed) throw new ForbiddenError("report_cards.regenerate");

  // Flagged cards first — those are the explicit, deliberate requests.
  const flagged = await prisma.reportCard.findMany({
    where: { needsRegeneration: true },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
      term: { select: { id: true, name: true } },
      class: { select: { name: true } },
    },
    orderBy: { updatedAt: "asc" },
  });

  // Then cards whose term has an assessment that is no longer APPROVED/LOCKED.
  // Derived from the same rule the generation gate applies, so the queue can
  // never disagree with what generation would allow.
  const candidates = await prisma.reportCard.findMany({
    where: { needsRegeneration: false },
    select: {
      id: true,
      studentId: true,
      termId: true,
      classId: true,
      status: true,
      referenceCode: true,
    },
  });

  const blockingByCard = new Map<string, RegenerationQueueItem["blockingAssessments"]>();

  for (const card of candidates) {
    const assessments = await prisma.assessment.findMany({
      where: { termId: card.termId, classId: card.classId },
      select: { id: true, title: true, status: true },
      orderBy: { createdAt: "asc" },
    });

    const blocking = assessments
      .filter((a) => !isEligible(a.status))
      .map((a) => ({
        assessmentId: a.id,
        title: a.title,
        status: a.status,
      }));

    if (blocking.length > 0) {
      blockingByCard.set(card.id, blocking);
    }
  }

  const staleIds = [...blockingByCard.keys()];

  const staleCards =
    staleIds.length > 0
      ? await prisma.reportCard.findMany({
          where: { id: { in: staleIds } },
          include: {
            student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
            term: { select: { id: true, name: true } },
            class: { select: { name: true } },
          },
        })
      : [];

  const toItem = (
    card: {
      id: string;
      studentId: string;
      termId: string;
      status: string;
      referenceCode: string | null;
      needsRegeneration: boolean;
      regenerationReason: string | null;
      student: { firstName: string; lastName: string; studentCode: string };
      term: { id: string; name: string };
      class: { name: string };
    },
    blocking: RegenerationQueueItem["blockingAssessments"],
  ): RegenerationQueueItem => ({
    reportCardId: card.id,
    studentId: card.studentId,
    studentName: `${card.student.firstName} ${card.student.lastName}`,
    studentCode: card.student.studentCode,
    termId: card.term.id,
    termName: card.term.name,
    className: card.class.name,
    status: card.status,
    referenceCode: card.referenceCode,
    needsRegeneration: card.needsRegeneration,
    regenerationReason: card.regenerationReason,
    stale: blocking.length > 0,
    blockingAssessments: blocking,
  });

  const items: RegenerationQueueItem[] = [
    ...flagged.map((card) => toItem(card, [])),
    ...staleCards.map((card) =>
      toItem(card, blockingByCard.get(card.id) ?? []),
    ),
  ];

  return items;
}

/**
 * Report cards whose contents are behind their assessments, for the named
 * students. Used by the correction-authorisation flow to tell the reviewer
 * which families will need a re-issued card — without the reviewer needing
 * the regeneration permission themselves.
 *
 * Read-only and informational: the caller has already authorised the actor
 * for the surrounding correction decision.
 */
export async function findStaleReportCardsForStudents(
  studentIds: string[],
  termId: string,
): Promise<
  Array<{
    reportCardId: string;
    studentId: string;
    status: string;
    needsRegeneration: boolean;
  }>
> {
  if (studentIds.length === 0) return [];

  const cards = await prisma.reportCard.findMany({
    where: { studentId: { in: studentIds }, termId },
    select: {
      id: true,
      studentId: true,
      status: true,
      needsRegeneration: true,
      classId: true,
      termId: true,
    },
  });

  if (cards.length === 0) return [];

  const out: Array<{
    reportCardId: string;
    studentId: string;
    status: string;
    needsRegeneration: boolean;
  }> = [];

  for (const card of cards) {
    const blockingCount = await prisma.assessment.count({
      where: {
        termId: card.termId,
        classId: card.classId,
        status: { notIn: [...ELIGIBLE_STATUSES] },
      },
    });

    // A card already carrying the flag is already queued; do not duplicate it.
    if (blockingCount > 0 || card.needsRegeneration) {
      out.push({
        reportCardId: card.id,
        studentId: card.studentId,
        status: card.status,
        needsRegeneration: card.needsRegeneration,
      });
    }
  }

  return out;
}
