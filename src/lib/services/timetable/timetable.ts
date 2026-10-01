// ============================================================
// Timetable Service
// ============================================================

import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { ForbiddenError } from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export async function getClassTimetable(
  actor: CurrentUser,
  classId: string
) {
  const allowed = await canForUser(actor, "timetable.read");
  if (!allowed) throw new ForbiddenError("timetable.read");

  const [cls, lessons] = await Promise.all([
    prisma.class.findUnique({
      where: { id: classId },
      include: {
        academicYear: true,
        educationLevel: true,
      },
    }),
    prisma.lesson.findMany({
      where: { classId },
      include: {
        subject: true,
        module: true,
        teacher: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
  ]);

  return {
    class: cls ? {
      id: cls.id,
      name: cls.name,
      levelName: cls.educationLevel.name,
      academicYearName: cls.academicYear.name,
    } : null,
    lessons: lessons.map((l) => ({
      id: l.id,
      dayOfWeek: l.dayOfWeek,
      dayName: DAYS[l.dayOfWeek - 1] ?? `Day ${l.dayOfWeek}`,
      startTime: l.startTime,
      endTime: l.endTime,
      room: l.room ?? "Main Hall",
      subjectName: l.subject?.name ?? l.module?.name ?? "General Study",
      teacherName: `${l.teacher.firstName} ${l.teacher.lastName}`,
    })),
  };
}
