// ============================================================
// Teacher Assessment Detail Service
// ============================================================
// Loads one assessment + all enrolled students + their existing
// marks. Used by the mark entry page.
//
// Scope: teacher must own the assessment (or be assigned to the
// class and subject of the assessment).
// ============================================================

import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";
import type { AssessmentType, AssessmentStatus } from "@prisma/client";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface AssessmentDetail {
  id: string;
  title: string;
  type: AssessmentType;
  status: AssessmentStatus;
  maxScore: string;
  weight: string | null;
  assessmentDate: Date | null;
  classId: string;
  className: string;
  subjectName: string | null;
  moduleName: string | null;
  academicYearName: string;
  termName: string;
  isEditable: boolean;
}

export interface StudentMarkRow {
  studentId: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  score: string | null;
  isAbsent: boolean;
  note: string | null;
}

export interface AssessmentDetailPageData {
  assessment: AssessmentDetail;
  students: StudentMarkRow[];
}

// ------------------------------------------------------------
// getAssessmentDetail
// ------------------------------------------------------------

export async function getAssessmentDetail(
  actor: CurrentUser,
  assessmentId: string,
): Promise<AssessmentDetailPageData> {
  // 1. Permission + scope
  const allowed = await canForUser(actor, "assessments.read", {
    type: "assessment",
    assessmentId,
  });
  if (!allowed) throw new ForbiddenError("assessments.read");

  // 2. Load assessment
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
      results: {
        select: {
          studentId: true,
          score: true,
          isAbsent: true,
          note: true,
        },
      },
    },
  });

  if (!assessment) {
    throw new NotFoundError("Assessment", assessmentId);
  }

  // 3. Load active students in the class
  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId: assessment.classId,
      status: "ACTIVE",
    },
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
  });

  // 4. Merge marks onto students
  const resultByStudent = new Map(
    assessment.results.map((r) => [r.studentId, r]),
  );

  const students: StudentMarkRow[] = enrollments.map((e) => {
    const r = resultByStudent.get(e.student.id);
    return {
      studentId: e.student.id,
      studentCode: e.student.studentCode,
      firstName: e.student.firstName,
      lastName: e.student.lastName,
      score: r?.score?.toString() ?? null,
      isAbsent: r?.isAbsent ?? false,
      note: r?.note ?? null,
    };
  });

  // 5. Editable only in DRAFT or RETURNED
  const EDITABLE: AssessmentStatus[] = ["DRAFT", "RETURNED"];

  return {
    assessment: {
      id: assessment.id,
      title: assessment.title,
      type: assessment.type,
      status: assessment.status,
      maxScore: assessment.maxScore.toString(),
      weight: assessment.weight?.toString() ?? null,
      assessmentDate: assessment.assessmentDate,
      classId: assessment.classId,
      className: assessment.class.name,
      subjectName: assessment.subject?.name ?? null,
      moduleName: assessment.module?.name ?? null,
      academicYearName: assessment.class.academicYear.name,
      termName: assessment.term.name,
      isEditable: EDITABLE.includes(assessment.status),
    },
    students,
  };
}