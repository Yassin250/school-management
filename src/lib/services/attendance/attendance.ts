// ============================================================
// Attendance Management Service
// ============================================================

import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { logAudit } from "@/lib/audit/audit";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";

export interface AttendanceRecordInput {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  note?: string;
}

export async function getClassAttendanceRoster(
  actor: CurrentUser,
  classId: string,
  lessonId?: string
) {
  const allowed = await canForUser(actor, "attendance.read", {
    type: "class",
    classId,
  });
  if (!allowed) throw new ForbiddenError("attendance.read");

  const [cls, enrollments, existingRecords] = await Promise.all([
    prisma.class.findUnique({
      where: { id: classId },
      include: {
        academicYear: true,
        educationLevel: true,
      },
    }),
    prisma.enrollment.findMany({
      where: { classId, status: "ACTIVE" },
      include: {
        student: true,
      },
      orderBy: { student: { lastName: "asc" } },
    }),
    lessonId
      ? prisma.attendance.findMany({
          where: { lessonId },
        })
      : Promise.resolve([]),
  ]);

  if (!cls) throw new NotFoundError("Class", classId);

  const recordsByStudent = new Map(existingRecords.map((r) => [r.studentId, r]));

  return {
    class: {
      id: cls.id,
      name: cls.name,
      academicYearName: cls.academicYear.name,
      educationLevelName: cls.educationLevel.name,
    },
    students: enrollments.map((e) => {
      const existing = recordsByStudent.get(e.student.id);
      return {
        id: e.student.id,
        studentCode: e.student.studentCode,
        firstName: e.student.firstName,
        lastName: e.student.lastName,
        currentStatus: existing?.status ?? "PRESENT",
        note: existing?.note ?? "",
      };
    }),
  };
}

export async function saveAttendance(
  actor: CurrentUser,
  params: {
    lessonId: string;
    records: AttendanceRecordInput[];
  }
) {
  const allowed = await canForUser(actor, "attendance.create");
  if (!allowed) throw new ForbiddenError("attendance.create");

  const { lessonId, records } = params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, teacherId: true, classId: true },
  });
  if (!lesson) throw new NotFoundError("Lesson", lessonId);

  const teacher = await prisma.teacher.findFirst({
    where: { userId: actor.id },
  });

  const markedById = teacher?.id ?? lesson.teacherId;

  return prisma.$transaction(async (tx) => {
    let savedCount = 0;
    for (const record of records) {
      await tx.attendance.upsert({
        where: {
          studentId_lessonId: {
            studentId: record.studentId,
            lessonId,
          },
        },
        update: {
          status: record.status,
          note: record.note ?? null,
          markedById,
        },
        create: {
          studentId: record.studentId,
          lessonId,
          status: record.status,
          note: record.note ?? null,
          markedById,
        },
      });
      savedCount++;
    }

    await logAudit({
      actorId: actor.id,
      action: "ATTENDANCE_MARKED",
      entity: "Lesson",
      entityId: lessonId,
      newValue: {
        recordsCount: savedCount,
      },
      tx,
    });

    return { success: true, savedCount };
  });
}
