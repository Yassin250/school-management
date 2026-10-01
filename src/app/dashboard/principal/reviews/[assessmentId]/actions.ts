"use server";

import { requireCurrentUser } from "@/lib/auth/session";
import {
  startReview,
  approveAssessment,
  returnAssessment,
} from "@/lib/services/grades/workflow";
import { isAppError } from "@/lib/errors";

export interface ReviewActionResult {
  error?: string;
  success?: boolean;
}

export async function startReviewAction(
  assessmentId: string,
): Promise<ReviewActionResult> {
  const user = await requireCurrentUser();

  try {
    await startReview(assessmentId, user);
  } catch (error) {
    if (isAppError(error)) return { error: error.message };
    console.error("[startReviewAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true };
}

export async function approveAction(
  assessmentId: string,
): Promise<ReviewActionResult> {
  const user = await requireCurrentUser();

  try {
    await approveAssessment(assessmentId, user);
  } catch (error) {
    if (isAppError(error)) return { error: error.message };
    console.error("[approveAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true };
}

export async function returnAction(
  assessmentId: string,
  reason: string,
): Promise<ReviewActionResult> {
  const user = await requireCurrentUser();

  try {
    await returnAssessment(assessmentId, reason, user);
  } catch (error) {
    if (isAppError(error)) return { error: error.message };
    console.error("[returnAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true };
}