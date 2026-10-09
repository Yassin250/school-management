"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/session";
import { approveAttendanceCorrection } from "@/lib/services/attendance/attendance";

export async function approveCorrectionAction(formData: FormData) {
  const user = await requireCurrentUser();
  const correctionId = formData.get("correctionId") as string;
  await approveAttendanceCorrection(user, correctionId);
  revalidatePath("/dashboard/principal/attendance");
}
