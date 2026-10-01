"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/session";
import { saveAttendance, type AttendanceRecordInput } from "@/lib/services/attendance/attendance";

export async function recordAttendanceAction(formData: FormData) {
  const user = await requireCurrentUser();

  const lessonId = formData.get("lessonId") as string;
  const studentIds = formData.getAll("studentId") as string[];

  const records: AttendanceRecordInput[] = studentIds.map((studentId) => {
    const status = (formData.get(`status_${studentId}`) as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED") || "PRESENT";
    const note = (formData.get(`note_${studentId}`) as string) || undefined;
    return { studentId, status, note };
  });

  await saveAttendance(user, {
    lessonId,
    records,
  });

  revalidatePath("/dashboard/teacher/attendance");
}
