// ============================================================
// Attendance Service
// ============================================================
// 1. saveAttendance — marks per-lesson attendance
// 2. listAttendance — read attendance for a lesson
// 3. getClassAttendanceRoster — loads the class + enrolled students
//    + any existing attendance for the given lesson
// ============================================================

import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { logAudit } from "@/lib/audit/audit";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";
import type { AttendanceStatus } from "@prisma/client";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface AttendanceRecordInput {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface SaveAttendanceInput {
  lessonId: string;
  records: AttendanceRecordInput[];
}

export interface AttendanceRosterStudent {
  id: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  currentStatus: AttendanceStatus;
  note: string;
}

export interface AttendanceRoster {
  class: {
    id: string;
    name: string;
    educationLevelName: string;
  };
  lessonId: string | null;
  students: AttendanceRosterStudent[];
}

// ------------------------------------------------------------
// getClassAttendanceRoster
// ------------------------------------------------------------
// Loads a class and its enrolled students. If a lessonId is given,
// prepends any existing attendance for that lesson.
// Scope: caller must be able to read the class (teacher assigned,
// or admin).
// ------------------------------------------------------------

export async function getClassAttendanceRoster(
  actor: CurrentUser,
  classId: string,
  lessonId?: string,
): Promise<AttendanceRoster> {
  // 1. Scope — reuse the class scope resolver
  const allowed = await canForUser(actor, "attendance.read", {
    type: "class",
    classId,
  });
  if (!allowed) {
    // Fall back to the general permission if the class scope resolver
    // doesn't accept attendance.read. This is a soft check.
    const generalAllowed = await canForUser(actor, "attendance.read");
    if (!generalAllowed) throw new ForbiddenError("attendance.read");
  }

  // 2. Load the class
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      educationLevel: { select: { name: true } },
    },
  });

  if (!cls) throw new NotFoundError("Class", classId);

  // 3. Load enrolled students
  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId,
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

  // 4. Load any existing attendance for the given lesson
  const existing = lessonId
    ? await prisma.attendance.findMany({
        where: {
          lessonId,
          studentId: { in: enrollments.map((e) => e.student.id) },
        },
        select: {
          studentId: true,
          status: true,
          note: true,
        },
      })
    : [];

  const attendanceByStudent = new Map(
    existing.map((a) => [a.studentId, a]),
  );

  const students: AttendanceRosterStudent[] = enrollments.map((e) => {
    const a = attendanceByStudent.get(e.student.id);
    return {
      id: e.student.id,
      studentCode: e.student.studentCode,
      firstName: e.student.firstName,
      lastName: e.student.lastName,
      currentStatus: a?.status ?? "PRESENT",
      note: a?.note ?? "",
    };
  });

  return {
    class: {
      id: cls.id,
      name: cls.name,
      educationLevelName: cls.educationLevel.name,
    },
    lessonId: lessonId ?? null,
    students,
  };
}

// ------------------------------------------------------------
// saveAttendance
// ------------------------------------------------------------

export async function saveAttendance(
  actor: CurrentUser,
  input: SaveAttendanceInput,
) {
  const { lessonId, records } = input;

  if (!lessonId) {
    throw new ValidationError("Lesson is required.");
  }

  if (!records || records.length === 0) {
    throw new ValidationError("No attendance records provided.");
  }

  // 1. Permission
  const allowed = await canForUser(actor, "attendance.create");
  if (!allowed) throw new ForbiddenError("attendance.create");

  // 2. Load the lesson
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true } },
    },
  });

  if (!lesson) throw new NotFoundError("Lesson", lessonId);

  // 3. Scope — only the assigned teacher or admin roles
  const isAdmin =
    actor.roles.includes("SYSTEM_ADMIN") ||
    actor.roles.includes("SCHOOL_ADMIN") ||
    actor.roles.includes("PRINCIPAL") ||
    actor.roles.includes("REGISTRAR");

  if (!isAdmin) {
    if (!actor.teacherId || lesson.teacher.id !== actor.teacherId) {
      throw new ForbiddenError("attendance.create");
    }
  }

  // 4. Validate students are enrolled in this class
  const studentIds = records.map((r) => r.studentId);
  const uniqueStudentIds = [...new Set(studentIds)];

  if (uniqueStudentIds.length !== studentIds.length) {
    throw new ValidationError("Duplicate student IDs in the request.");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId: lesson.class.id,
      studentId: { in: uniqueStudentIds },
      status: "ACTIVE",
    },
    select: { studentId: true },
  });

  const enrolled = new Set(enrollments.map((e) => e.studentId));
  const notEnrolled = uniqueStudentIds.filter((id) => !enrolled.has(id));
  if (notEnrolled.length > 0) {
    throw new ValidationError(
      `${notEnrolled.length} student(s) are not enrolled in ${lesson.class.name}.`,
    );
  }

  // 5. Determine markedById — required FK to Teacher
  let markedById = actor.teacherId;
  if (!markedById) {
    // Admin/registrar marking on behalf of the lesson's teacher
    markedById = lesson.teacher.id;
  }

  // 6. Transaction


  return prisma.$transaction(async (tx) => {
    let created = 0;
    let updated = 0;

    for (const record of records) {
      const existing = await tx.attendance.findUnique({
        where: {
          studentId_lessonId: {
            studentId: record.studentId,
            lessonId,
          },
        },
      });

      if (existing) {
        await tx.attendance.update({
          where: { id: existing.id },
          data: {
            status: record.status,
            note: record.note ?? null,
            markedById,
          },
        });
        updated++;
      } else {
        await tx.attendance.create({
          data: {
            studentId: record.studentId,
            lessonId,
            status: record.status,
            note: record.note ?? null,
            markedById,
          },
        });
        created++;
      }
    }

    await logAudit({
      actorId: actor.id,
      action: "ATTENDANCE_MARKED",
      entity: "Lesson",
      entityId: lessonId,
      description: `Attendance marked for ${records.length} student(s)`,
      newValue: {
        lessonId,
        created,
        updated,
        total: records.length,
      },
      tx,
    });

    return { created, updated, total: records.length };
  });
}

// ------------------------------------------------------------
// listAttendance
// ------------------------------------------------------------

export async function listAttendance(
  actor: CurrentUser,
  lessonId: string,
) {
  const allowed = await canForUser(actor, "attendance.read");
  if (!allowed) throw new ForbiddenError("attendance.read");

  return prisma.attendance.findMany({
    where: { lessonId },
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
    orderBy: { student: { lastName: "asc" } },
  });
}