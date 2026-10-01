// ============================================================
// Student Grade Service
// ============================================================
// Retrieves approved assessment results and report cards for
// the currently authenticated student.
//
// Rules:
//   - Students only see assessments in APPROVED or LOCKED state.
//   - Scoped strictly to the student's own ID.
// ============================================================

import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";

export interface StudentAssessmentItem {
  id: string;
  assessmentId: string;
  title: string;
  type: string;
  subjectName: string;
  score: number | null;
  maxScore: number;
  percentage: number | null;
  isAbsent: boolean;
  note: string | null;
  assessmentDate: Date | null;
  teacherName: string;
}

export interface StudentGradeOverview {
  student: {
    id: string;
    studentCode: string;
    firstName: string;
    lastName: string;
    className: string;
    academicYearName: string;
  };
  assessments: StudentAssessmentItem[];
  averageScorePercent: number | null;
  totalAssessmentsCount: number;
  latestReportCard: {
    id: string;
    termName: string;
    averageScore: number | null;
    status: string;
    teacherComment: string | null;
    principalComment: string | null;
  } | null;
}

export async function getStudentGradeOverview(
  actor: CurrentUser,
): Promise<StudentGradeOverview> {
  if (!actor.studentId) {
    throw new ForbiddenError("grades.read");
  }

  const student = await prisma.student.findUnique({
    where: { id: actor.studentId },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: true,
          academicYear: true,
        },
        take: 1,
      },
    },
  });

  if (!student) {
    throw new NotFoundError("Student", actor.studentId);
  }

  const currentEnrollment = student.enrollments[0];
  const className = currentEnrollment?.class.name ?? "Unassigned";
  const academicYearName = currentEnrollment?.academicYear.name ?? "Current Year";

  // Fetch approved assessment results for this student
  const results = await prisma.assessmentResult.findMany({
    where: {
      studentId: student.id,
      assessment: {
        status: { in: ["APPROVED", "LOCKED"] },
      },
    },
    include: {
      assessment: {
        include: {
          subject: true,
          module: true,
          teacher: true,
        },
      },
    },
    orderBy: {
      assessment: {
        createdAt: "desc",
      },
    },
  });

  let totalPercent = 0;
  let gradedCount = 0;

  const assessmentItems: StudentAssessmentItem[] = results.map((r) => {
    const maxScore = Number(r.assessment.maxScore);
    const score = r.score !== null ? Number(r.score) : null;
    const percentage =
      score !== null && maxScore > 0 ? (score / maxScore) * 100 : null;

    if (percentage !== null && !r.isAbsent) {
      totalPercent += percentage;
      gradedCount++;
    }

    const teacherName = `${r.assessment.teacher.firstName} ${r.assessment.teacher.lastName}`;
    const subjectName =
      r.assessment.subject?.name ?? r.assessment.module?.name ?? "General";

    return {
      id: r.id,
      assessmentId: r.assessment.id,
      title: r.assessment.title,
      type: r.assessment.type,
      subjectName,
      score,
      maxScore,
      percentage: percentage !== null ? Math.round(percentage * 10) / 10 : null,
      isAbsent: r.isAbsent,
      note: r.note,
      assessmentDate: r.assessment.assessmentDate,
      teacherName,
    };
  });

  const averageScorePercent =
    gradedCount > 0 ? Math.round((totalPercent / gradedCount) * 10) / 10 : null;

  // Fetch latest published or approved report card
  const reportCard = await prisma.reportCard.findFirst({
    where: {
      studentId: student.id,
      status: { in: ["APPROVED", "PUBLISHED"] },
    },
    include: {
      term: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    student: {
      id: student.id,
      studentCode: student.studentCode,
      firstName: student.firstName,
      lastName: student.lastName,
      className,
      academicYearName,
    },
    assessments: assessmentItems,
    averageScorePercent,
    totalAssessmentsCount: assessmentItems.length,
    latestReportCard: reportCard
      ? {
          id: reportCard.id,
          termName: reportCard.term.name,
          averageScore:
            reportCard.averageScore !== null
              ? Number(reportCard.averageScore)
              : null,
          status: reportCard.status,
          teacherComment: reportCard.teacherComment,
          principalComment: reportCard.principalComment,
        }
      : null,
  };
}
