"use server";

import { requireCurrentUser } from "@/lib/auth/session";
import { enterResultsBulk } from "@/lib/services/grades/results";
import { isAppError } from "@/lib/errors";

export interface SaveMarksResult {
  error?: string;
  success?: boolean;
}

export async function saveMarksAction(
  assessmentId: string,
  rowsJson: string,
): Promise<SaveMarksResult> {
  let rows: Array<{
    studentId: string;
    score: number | null;
    isAbsent: boolean;
    note?: string;
  }>;

  try {
    rows = JSON.parse(rowsJson);
  } catch {
    return { error: "Invalid submission. Please try again." };
  }

  const user = await requireCurrentUser();

  try {
    await enterResultsBulk({
      assessmentId,
      results: rows,
      actor: user,
    });
  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message };
    }
    console.error("[saveMarksAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true };
}