"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/session";
import {
  createGradeScale,
  updateGradeScale,
  activateGradeScale,
  archiveGradeScale,
  type GradeBandInput,
} from "@/lib/services/grades/grade-scales";
import { isAppError } from "@/lib/errors";
import type { EducationArea } from "@prisma/client";

const LIST_PATH = "/dashboard/admin/grade-scales";

export interface ActionResult {
  error?: string;
  success?: boolean;
  scaleId?: string;
  issues?: Array<{ path: string; message: string }>;
}

interface RawBand {
  minScore?: unknown;
  maxScore?: unknown;
  symbol?: unknown;
  description?: unknown;
  points?: unknown;
  isPass?: unknown;
}

function toBandInput(raw: unknown): GradeBandInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const band = raw as RawBand;

  return {
    minScore: Number(band.minScore),
    maxScore: Number(band.maxScore),
    symbol: typeof band.symbol === "string" ? band.symbol : "",
    description: typeof band.description === "string" ? band.description : null,
    points:
      band.points === null || band.points === undefined
        ? null
        : Number(band.points),
    isPass: band.isPass !== false,
  };
}

/**
 * The band editor posts the whole band set as one JSON array, so a
 * create/update is a single atomic operation rather than N round trips.
 */
function parseBands(formData: FormData): GradeBandInput[] {
  const raw = formData.get("bands");
  if (typeof raw !== "string" || raw.trim() === "") return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new SyntaxError("Grade band data could not be read.");
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map(toBandInput)
    .filter((b): b is GradeBandInput => b !== null);
}

function issuesOf(error: unknown) {
  const issues = (error as { issues?: Array<{ path: string; message: string }> })
    .issues;
  return Array.isArray(issues) ? issues : undefined;
}

export async function createGradeScaleAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireCurrentUser();

  try {
    const created = await createGradeScale(user, {
      name: String(formData.get("name") ?? ""),
      educationArea: String(
        formData.get("educationArea") ?? "",
      ) as EducationArea,
      description: String(formData.get("description") ?? "") || null,
      bands: parseBands(formData),
    });

    revalidatePath(LIST_PATH);
    return { success: true, scaleId: created.id };
  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message, issues: issuesOf(error) };
    }
    console.error("[createGradeScaleAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function updateGradeScaleAction(
  scaleId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireCurrentUser();

  try {
    await updateGradeScale(user, scaleId, {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? "") || null,
      bands: parseBands(formData),
    });

    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${scaleId}`);
    return { success: true, scaleId };
  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message, issues: issuesOf(error) };
    }
    console.error("[updateGradeScaleAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function activateGradeScaleAction(
  scaleId: string,
): Promise<ActionResult> {
  const user = await requireCurrentUser();

  try {
    await activateGradeScale(user, scaleId);
    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${scaleId}`);
    return { success: true, scaleId };
  } catch (error) {
    if (isAppError(error)) return { error: error.message };
    console.error("[activateGradeScaleAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function archiveGradeScaleAction(
  scaleId: string,
): Promise<ActionResult> {
  const user = await requireCurrentUser();

  try {
    await archiveGradeScale(user, scaleId);
    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${scaleId}`);
    return { success: true, scaleId };
  } catch (error) {
    if (isAppError(error)) return { error: error.message };
    console.error("[archiveGradeScaleAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }
}
