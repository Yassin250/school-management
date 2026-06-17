"use server";

import { actionSuccess, type ActionResult } from "@/lib/actions/types";
import { withPermission } from "@/lib/actions/helpers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveAttendance({
  lessonId,
  date,
  records,
}: {
  lessonId: number;
  date: string;
  records: { studentId: string; present: boolean }[];
}): Promise<ActionResult<void>> {
  return withPermission("attendance:manage", async () => {
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    await prisma.$transaction(
      records.map((rec) =>
        prisma.attendance.upsert({
          where: {
            studentId_lessonId_date: {
              studentId: rec.studentId,
              lessonId,
              date: attendanceDate,
            },
          },
          update: {
            present: rec.present,
          },
          create: {
            studentId: rec.studentId,
            lessonId,
            date: attendanceDate,
            present: rec.present,
          },
        })
      )
    );

    revalidatePath("/dashboard/teacher/attendance");
    return actionSuccess();
  }, "Failed to save attendance");
}

export async function getAttendanceHistory(lessonId: number, dateStr: string) {
  return withPermission("attendance:manage", async () => {
    const queryDate = new Date(dateStr);
    queryDate.setHours(0, 0, 0, 0);

    const attendances = await prisma.attendance.findMany({
      where: {
        lessonId,
        date: queryDate,
      },
      include: {
        student: true,
      },
    });

    return actionSuccess(attendances);
  }, "Failed to load history");
}

/** Mark all students present, then allow toggling individual absences */
export async function markAllPresent({
  lessonId,
  date,
  studentIds,
}: {
  lessonId: number;
  date: string;
  studentIds: string[];
}): Promise<ActionResult<void>> {
  return saveAttendance({
    lessonId,
    date,
    records: studentIds.map((studentId) => ({ studentId, present: true })),
  });
}
