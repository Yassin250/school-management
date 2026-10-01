// ============================================================
// Principal Reviews Service
// ============================================================
// Lists assessments awaiting review/approval and provides
// the detail needed for the principal to make a decision.
// ============================================================

import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";
import type { AssessmentType, AssessmentStatus } from "@prisma/client";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface PendingReview {
  assessmentId: string;
  title: string;
  type: AssessmentType;
  status: AssessmentStatus;
  subjectName: string | null;
  moduleName: string | null;
  className: string;
  teacherName: string;
  submittedAt: Date | null;
  studentCount: number;
  resultCount: number;
}

export interface ReviewDetail {
  id: string;
  title: string;
  type: AssessmentType;
  status: AssessmentStatus;
  maxScore: string;
  weight: string | null;
  assessmentDate: Date | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  approvedAt: Date | null;
  returnedReason: string | null;
  className: string;
  classId: string;
  subjectName: string | null;
  moduleName: string | null;
  academicYearName: string;
  termName: string;
  teacherName: string;
  isReviewable: boolean;
}

export interface ReviewStudentRow {
  studentId: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  score: string | null;
  isAbsent: boolean;
  note: string | null;
}

export interface ReviewDetailPageData {
  review: ReviewDetail;
  students: ReviewStudentRow[];
}

// ------------------------------------------------------------
// listPendingReviews
// ------------------------------------------------------------
// Returns assessments with status SUBMITTED (awaiting review).
// Scope: the principal sees school-wide.
// ------------------------------------------------------------

export async function listPendingReviews(
  actor: CurrentUser,
): Promise<PendingReview[]> {
  const allowed = await canForUser(actor, "grades.review");
  if (!allowed) throw new ForbiddenError("grades.review");

  const assessments = await prisma.assessment.findMany({
    where: {
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
    },
    include: {
      class: { select: { name: true } },
      subject: { select: { name: true } },
      module: { select: { name: true } },
      teacher: { select: { firstName: true, lastName: true } },
      _count: {
        select: {
          results: true,
        },
      },
    },
    orderBy: { submittedAt: "asc" },
  });

  // For each assessment, count active students in the class
  const classIds = [...new Set(assessments.map((a) => a.classId))];
  const enrollmentCounts = await prisma.enrollment.groupBy({
    by: ["classId"],
    where: {
      classId: { in: classIds },
      status: "ACTIVE",
    },
    _count: { _all: true },
  });
  const studentCountByClass = new Map(
    enrollmentCounts.map((e) => [e.classId, e._count._all]),
  );

  return assessments.map((a) => ({
    assessmentId: a.id,
    title: a.title,
    type: a.type,
    status: a.status,
    subjectName: a.subject?.name ?? null,
    moduleName: a.module?.name ?? null,
    className: a.class.name,
    teacherName: `${a.teacher.firstName} ${a.teacher.lastName}`,
    submittedAt: a.submittedAt,
    studentCount: studentCountByClass.get(a.classId) ?? 0,
    resultCount: a._count.results,
  }));
}

// ------------------------------------------------------------
// getReviewDetail
// ------------------------------------------------------------

export async function getReviewDetail(
  actor: CurrentUser,
  assessmentId: string,
): Promise<ReviewDetailPageData> {
  const allowed = await canForUser(actor, "grades.review", {
    type: "assessment",
    assessmentId,
  });
  if (!allowed) throw new ForbiddenError("grades.review");

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          academicYear: { select: { name: true } },
        },
      },
      subject: { select: { name: true } },
      module: { select: { name: true } },
      term: { select: { name: true } },
      teacher: { select: { firstName: true, lastName: true } },
      results: {
        include: {
          student: {
            select: {
              id: true,
              studentCode: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { student: { lastName: "asc" } },
          { student: { firstName: "asc" } },
        ],
      },
    },
  });

  if (!assessment) throw new NotFoundError("Assessment", assessmentId);

  // Only SUBMITTED and UNDER_REVIEW can be reviewed
  const REVIEWABLE: AssessmentStatus[] = ["SUBMITTED", "UNDER_REVIEW"];

  const students: ReviewStudentRow[] = assessment.results.map((r) => ({
    studentId: r.student.id,
    studentCode: r.student.studentCode,
    firstName: r.student.firstName,
    lastName: r.student.lastName,
    score: r.score?.toString() ?? null,
    isAbsent: r.isAbsent,
    note: r.note,
  }));

  return {
    review: {
      id: assessment.id,
      title: assessment.title,
      type: assessment.type,
      status: assessment.status,
      maxScore: assessment.maxScore.toString(),
      weight: assessment.weight?.toString() ?? null,
      assessmentDate: assessment.assessmentDate,
      submittedAt: assessment.submittedAt,
      reviewedAt: assessment.reviewedAt,
      approvedAt: assessment.approvedAt,
      returnedReason: assessment.returnedReason,
      className: assessment.class.name,
      classId: assessment.class.id,
      subjectName: assessment.subject?.name ?? null,
      moduleName: assessment.module?.name ?? null,
      academicYearName: assessment.class.academicYear.name,
      termName: assessment.term.name,
      teacherName: `${assessment.teacher.firstName} ${assessment.teacher.lastName}`,
      isReviewable: REVIEWABLE.includes(assessment.status),
    },
    students,
  };
}