// ============================================================
// Teacher Class Detail Service
// ============================================================

import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";

export interface ClassStudent {
  studentId: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  sex: "MALE" | "FEMALE";
}

export interface ClassSubject {
  subjectId: string | null;
  subjectCode: string | null;
  subjectName: string | null;
  moduleId: string | null;
  moduleCode: string | null;
  moduleName: string | null;
}

export interface AllClassSubject {
  id: string;
  name: string;
  code: string;
}

export interface TeacherClassDetail {
  classId: string;
  className: string;
  stream: string | null;
  capacity: number;
  academicYearId: string;
  academicYearName: string;
  educationLevelCode: string;
  educationLevelName: string;
  classTeacherName: string | null;
  students: ClassStudent[];
  subjects: ClassSubject[];
  allSubjects: AllClassSubject[];
}

export async function getTeacherClassDetail(
  actor: CurrentUser,
  classId: string,
): Promise<TeacherClassDetail> {
  // 1. Permission + scope
  const allowed = await canForUser(actor, "teacher_assignments.read", {
    type: "class",
    classId,
  });
  if (!allowed) {
    throw new ForbiddenError("teacher_assignments.read");
  }

  if (!actor.teacherId) {
    throw new ForbiddenError("teacher_assignments.read");
  }

  // 2. Load the class with its data
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      academicYear: { select: { id: true, name: true } },
      educationLevel: { select: { code: true, name: true } },
      classTeacher: {
        select: { firstName: true, lastName: true },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          student: {
            select: {
              id: true,
              studentCode: true,
              firstName: true,
              lastName: true,
              sex: true,
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

  if (!cls) {
    throw new NotFoundError("Class", classId);
  }

  // 3. This teacher's assignments in this class
  const assignments = await prisma.teacherAssignment.findMany({
    where: {
      teacherId: actor.teacherId,
      classId,
      academicYearId: cls.academicYearId,
    },
    include: {
      subject: { select: { id: true, code: true, name: true } },
      module: { select: { id: true, code: true, name: true } },
    },
    orderBy: [{ subject: { name: "asc" } }, { module: { name: "asc" } }],
  });

  if (assignments.length === 0) {
    throw new ForbiddenError("teacher_assignments.read");
  }

  // 4. ALL subjects the class takes (common core for lower secondary)
  const allSubjects = await prisma.classSubject.findMany({
    where: { classId },
    include: {
      subject: { select: { id: true, name: true, code: true } },
    },
    orderBy: { subject: { name: "asc" } },
  });

  return {
    classId: cls.id,
    className: cls.name,
    stream: cls.stream,
    capacity: cls.capacity,
    academicYearId: cls.academicYear.id,
    academicYearName: cls.academicYear.name,
    educationLevelCode: cls.educationLevel.code,
    educationLevelName: cls.educationLevel.name,
    classTeacherName: cls.classTeacher
      ? `${cls.classTeacher.firstName} ${cls.classTeacher.lastName}`
      : null,
    students: cls.enrollments.map((e) => ({
      studentId: e.student.id,
      studentCode: e.student.studentCode,
      firstName: e.student.firstName,
      lastName: e.student.lastName,
      sex: e.student.sex,
    })),
    subjects: assignments.map((a) => ({
      subjectId: a.subject?.id ?? null,
      subjectCode: a.subject?.code ?? null,
      subjectName: a.subject?.name ?? null,
      moduleId: a.module?.id ?? null,
      moduleCode: a.module?.code ?? null,
      moduleName: a.module?.name ?? null,
    })),
    allSubjects: allSubjects.map((cs) => ({
      id: cs.subject.id,
      name: cs.subject.name,
      code: cs.subject.code,
    })),
  };
}