"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/session";
import {
  generateReportCard,
  approveReportCard,
  publishReportCard,
} from "@/lib/services/grades/report-card";

export async function generateReportCardAction(formData: FormData) {
  const user = await requireCurrentUser();
  const studentId = formData.get("studentId") as string;
  const termId = formData.get("termId") as string;

  await generateReportCard({
    studentId,
    termId,
    actor: user,
  });

  revalidatePath("/dashboard/admin/report-cards");
}

export async function approveReportCardAction(formData: FormData) {
  const user = await requireCurrentUser();
  const reportCardId = formData.get("reportCardId") as string;

  await approveReportCard(reportCardId, user);
  revalidatePath("/dashboard/admin/report-cards");
}

export async function publishReportCardAction(formData: FormData) {
  const user = await requireCurrentUser();
  const reportCardId = formData.get("reportCardId") as string;

  await publishReportCard(reportCardId, user);
  revalidatePath("/dashboard/admin/report-cards");
}
