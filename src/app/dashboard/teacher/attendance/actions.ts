"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/session";
import {
  saveAttendance,
  finalizeAttendance,
  type AttendanceRecordInput,
} from "@/lib/services/attendance/attendance";

function parseRecords(formData: FormData): AttendanceRecordInput[] {
  const studentIds = formData.getAll("studentId") as string[];
  return studentIds.map((studentId) => {
    const status =
      (formData.get(`status_${studentId}`) as
        | "PRESENT"
        | "ABSENT"
        | "LATE"
        | "EXCUSED") || "PRESENT";
    const note = (formData.get(`note_${studentId}`) as string) || undefined;
    return { studentId, status, note };
  });
}

export async function recordAttendanceAction(formData: FormData) {
  const user = await requireCurrentUser();
  const lessonId = formData.get("lessonId") as string;
  const sessionDate = (formData.get("sessionDate") as string) || undefined;

  await saveAttendance(user, {
    lessonId,
    sessionDate,
    records: parseRecords(formData),
  });

  revalidatePath("/dashboard/teacher/attendance");
}

export async function finalizeAttendanceAction(formData: FormData) {
  const user = await requireCurrentUser();
  const sessionId = formData.get("sessionId") as string;
  if (!sessionId) {
    throw new Error("Save attendance before finalizing.");
  }

  await finalizeAttendance(user, sessionId);
  revalidatePath("/dashboard/teacher/attendance");
}
