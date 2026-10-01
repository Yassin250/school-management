// ============================================================
// Teacher Classes Service
// ============================================================
// Returns the classes a teacher is assigned to teach, along
// with the subjects/modules they teach in each class.
//
// This is the first vertical slice that connects:
//   CurrentUser -> Scope -> TeacherAssignment -> Class -> Subject
// ============================================================

import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { ForbiddenError } from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface TeacherClassSubject {
  assignmentId: string;
  subjectId: string | null;
  subjectName: string | null;
  subjectCode: string | null;
  moduleId: string | null;
  moduleName: string | null;
  moduleCode: string | null;
}

export interface TeacherClass {
  classId: string;
  className: string;
  stream: string | null;
  academicYearId: string;
  academicYearName: string;
  educationLevelCode: string;
  educationLevelName: string;
  studentCount: number;
  subjects: TeacherClassSubject[];
}

// ------------------------------------------------------------
// getTeacherClasses
// ------------------------------------------------------------
// Returns all classes the teacher is assigned to teach in the
// current academic year. Groups assignments by class.
//
// Scope: only the teacher's own classes.
// Permission: teacher_assignments.read.

export async function getTeacherClasses(
  actor: CurrentUser,
): Promise<TeacherClass[]> {
  // 1. Permission check - the teacher must be able to read assignments
  const allowed = await canForUser(actor, "teacher_assignments.read");
  if (!allowed) {
    throw new ForbiddenError("teacher_assignments.read");
  }

  // 2. Teacher profile is required
  if (!actor.teacherId) {
    return [];
  }

  // 3. Load all assignments for this teacher in the current academic year
  const assignments = await prisma.teacherAssignment.findMany({
    where: {
      teacherId: actor.teacherId,
      academicYear: { isCurrent: true },
    },
    include: {
      class: {
        include: {
          academicYear: { select: { id: true, name: true } },
          educationLevel: { select: { code: true, name: true } },
          _count: {
            select: {
              enrollments: { where: { status: "ACTIVE" } },
            },
          },
        },
      },
      subject: { select: { id: true, name: true, code: true } },
      module: { select: { id: true, name: true, code: true } },
    },
    orderBy: [
      { class: { name: "asc" } },
      { subject: { name: "asc" } },
    ],
  });

  // 4. Group assignments by class
  const byClass = new Map<string, TeacherClass>();

  for (const a of assignments) {
    const classId = a.class.id;

    let entry = byClass.get(classId);
    if (!entry) {
      entry = {
        classId,
        className: a.class.name,
        stream: a.class.stream,
        academicYearId: a.class.academicYear.id,
        academicYearName: a.class.academicYear.name,
        educationLevelCode: a.class.educationLevel.code,
        educationLevelName: a.class.educationLevel.name,
        studentCount: a.class._count.enrollments,
        subjects: [],
      };
      byClass.set(classId, entry);
    }

    entry.subjects.push({
      assignmentId: a.id,
      subjectId: a.subject?.id ?? null,
      subjectName: a.subject?.name ?? null,
      subjectCode: a.subject?.code ?? null,
      moduleId: a.module?.id ?? null,
      moduleName: a.module?.name ?? null,
      moduleCode: a.module?.code ?? null,
    });
  }

  return Array.from(byClass.values());
}