// src/lib/actions/attendance.ts
"use server";

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
}) {
  try {
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Using transaction to upsert records
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
    return { success: true };
  } catch (error) {
    console.error("Save attendance error:", error);
    return { success: false, error: "Failed to save attendance" };
  }
}

export async function getAttendanceHistory(lessonId: number, dateStr: string) {
  try {
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

    return { success: true, data: attendances };
  } catch (error) {
    console.error("Get attendance history error:", error);
    return { success: false, error: "Failed to load history" };
  }
}
