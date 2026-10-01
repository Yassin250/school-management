"use server";

import { requireCurrentUser } from "@/lib/auth/session";
import { submitAssessment } from "@/lib/services/grades/workflow";
import { isAppError } from "@/lib/errors";

export interface SubmitAssessmentResult {
  error?: string;
  success?: boolean;
}

export async function submitAssessmentAction(
  assessmentId: string,
): Promise<SubmitAssessmentResult> {
  const user = await requireCurrentUser();

  try {
    await submitAssessment(assessmentId, user);
  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message };
    }
    console.error("[submitAssessmentAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true };
}