// ============================================================
// Parent Grade Service
// ============================================================
// Retrieves linked children and their approved assessment results
// for the currently authenticated parent.
//
// Rules:
//   - Parents only see children linked to them in ParentStudent.
//   - Parents only see assessments in APPROVED or LOCKED state.
// ============================================================

import { prisma } from "@/lib/prisma";
import { ForbiddenError } from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";

export interface ParentChildSummary {
  studentId: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  className: string;
  relationship: string | null;
  averageScorePercent: number | null;
  assessmentsCount: number;
  latestReportCardStatus: string | null;
}

export interface ParentOverviewData {
  parent: {
    id: string;
    name: string;
  };
  children: ParentChildSummary[];
}

export async function getParentOverview(
  actor: CurrentUser,
): Promise<ParentOverviewData> {
  if (!actor.parentId) {
    throw new ForbiddenError("parents.read");
  }

  const parent = await prisma.parent.findUnique({
    where: { id: actor.parentId },
    include: {
      studentLinks: {
        include: {
          student: {
            include: {
              enrollments: {
                where: { status: "ACTIVE" },
                include: { class: true },
                take: 1,
              },
              assessmentResults: {
                where: {
                  assessment: {
                    status: { in: ["APPROVED", "LOCKED"] },
                  },
                },
                include: {
                  assessment: true,
                },
              },
              reportCards: {
                where: {
                  status: { in: ["APPROVED", "PUBLISHED"] },
                },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!parent) {
    throw new ForbiddenError("parents.read");
  }

  const children: ParentChildSummary[] = parent.studentLinks.map((link) => {
    const s = link.student;
    const currentEnrollment = s.enrollments[0];
    const className = currentEnrollment?.class.name ?? "Unassigned";

    let totalPercent = 0;
    let count = 0;

    for (const r of s.assessmentResults) {
      const max = Number(r.assessment.maxScore);
      const score = r.score !== null ? Number(r.score) : null;
      if (score !== null && max > 0 && !r.isAbsent) {
        totalPercent += (score / max) * 100;
        count++;
      }
    }

    const avg = count > 0 ? Math.round((totalPercent / count) * 10) / 10 : null;
    const latestRc = s.reportCards[0]?.status ?? null;

    return {
      studentId: s.id,
      studentCode: s.studentCode,
      firstName: s.firstName,
      lastName: s.lastName,
      className,
      relationship: link.relationship,
      averageScorePercent: avg,
      assessmentsCount: s.assessmentResults.length,
      latestReportCardStatus: latestRc,
    };
  });

  return {
    parent: {
      id: parent.id,
      name: `${parent.firstName} ${parent.lastName}`,
    },
    children,
  };
}
