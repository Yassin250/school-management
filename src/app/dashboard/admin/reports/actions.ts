"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/session";
import {
  generateReportCard,
  approveReportCard,
  publishReportCard,
} from "@/lib/services/grades/report-card";
import { isAppError } from "@/lib/errors";

export interface ActionResult {
  error?: string;
  success?: boolean;
  reportCardId?: string;
}

export async function generateReportCardAction(
  studentId: string,
  termId: string,
): Promise<ActionResult> {
  const user = await requireCurrentUser();

  try {
    const rc = await generateReportCard({
      studentId,
      termId,
      actor: user,
    });
    revalidatePath("/dashboard/admin/reports");
    return { success: true, reportCardId: rc.id };
  } catch (error) {
    if (isAppError(error)) return { error: error.message };
    console.error("[generateReportCardAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function approveReportCardAction(
  reportCardId: string,
): Promise<ActionResult> {
  const user = await requireCurrentUser();

  try {
    await approveReportCard(reportCardId, user);
    revalidatePath("/dashboard/admin/reports");
    return { success: true };
  } catch (error) {
    if (isAppError(error)) return { error: error.message };
    console.error("[approveReportCardAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function publishReportCardAction(
  reportCardId: string,
): Promise<ActionResult> {
  const user = await requireCurrentUser();

  try {
    await publishReportCard(reportCardId, user);
    revalidatePath("/dashboard/admin/reports");
    return { success: true };
  } catch (error) {
    if (isAppError(error)) return { error: error.message };
    console.error("[publishReportCardAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }
}