"use server";

import { requireCurrentUser } from "@/lib/auth/session";
import { createAssessment } from "@/lib/services/teacher/assessments";
import { isAppError } from "@/lib/errors";
import type { AssessmentType } from "@prisma/client";

export interface CreateAssessmentResult {
  error?: string;
}

export async function createAssessmentAction(
  classId: string,
  formData: FormData,
): Promise<CreateAssessmentResult> {
  const user = await requireCurrentUser();

  const title = String(formData.get("title") ?? "");
  const type = String(formData.get("type") ?? "") as AssessmentType;
  const subjectId = formData.get("subjectId");
  const maxScoreRaw = formData.get("maxScore");
  const weightRaw = formData.get("weight");
  const assessmentDateRaw = formData.get("assessmentDate");

  let sid: string | null = null;
  let mid: string | null = null;
  if (subjectId && typeof subjectId === "string" && subjectId.includes(":")) {
    const parts = subjectId.split(":");
    const kind = parts[0];
    const id = parts[1];
    if (kind === "subject") sid = id;
    if (kind === "module") mid = id;
  }

  const maxScore = Number(maxScoreRaw);
  const weight =
    weightRaw && String(weightRaw).trim() !== ""
      ? Number(weightRaw)
      : null;
  const assessmentDate =
    assessmentDateRaw && String(assessmentDateRaw).trim() !== ""
      ? new Date(String(assessmentDateRaw))
      : null;

  try {
    await createAssessment(user, {
      classId,
      title,
      type,
      subjectId: sid,
      moduleId: mid,
      maxScore,
      weight,
      assessmentDate,
    });
  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message };
    }
    return { error: "Something went wrong. Please try again." };
  }

  return {};
}