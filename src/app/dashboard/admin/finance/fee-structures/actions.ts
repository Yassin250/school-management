"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/session";
import {
  createFeeStructure,
  archiveFeeStructure,
} from "@/lib/services/finance/fee-structures";
import { isAppError } from "@/lib/errors";
import type { FeeType } from "@prisma/client";

export interface ActionResult {
  error?: string;
  success?: boolean;
  feeStructureId?: string;
}

export async function createFeeStructureAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireCurrentUser();

  try {
    const name = String(formData.get("name") ?? "");
    const academicYearId = String(formData.get("academicYearId") ?? "");
    const educationLevelId = formData.get("educationLevelId");
    const tradeId = formData.get("tradeId");
    const feeType = String(formData.get("feeType") ?? "") as FeeType;
    const amountRaw = formData.get("amount");
    const isMandatoryRaw = formData.get("isMandatory");
    const description = formData.get("description");

    const amount = Number(amountRaw);
    const isMandatory = isMandatoryRaw === "on" || isMandatoryRaw === "true";

    // Determine level vs trade from the picker (kind:id format)
    let levelId: string | null = null;
    let tradeIdValue: string | null = null;

    if (typeof educationLevelId === "string" && educationLevelId.includes(":")) {
      const [kind, id] = educationLevelId.split(":");
      if (kind === "level") levelId = id;
      if (kind === "trade") tradeIdValue = id;
    }

    // fallback: if tradeId form field directly provided
    if (typeof tradeId === "string" && tradeId.length > 0 && !tradeIdValue) {
      tradeIdValue = tradeId;
    }

    const created = await createFeeStructure(user, {
      name,
      academicYearId,
      educationLevelId: levelId,
      tradeId: tradeIdValue,
      feeType,
      amount,
      isMandatory,
      description:
        typeof description === "string" && description.trim() !== ""
          ? description.trim()
          : null,
    });

    revalidatePath("/dashboard/admin/finance/fee-structures");
    return { success: true, feeStructureId: created.id };
  } catch (error) {
    if (isAppError(error)) return { error: error.message };
    console.error("[createFeeStructureAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function archiveFeeStructureAction(
  feeStructureId: string,
): Promise<ActionResult> {
  const user = await requireCurrentUser();

  try {
    await archiveFeeStructure(user, feeStructureId);
    revalidatePath("/dashboard/admin/finance/fee-structures");
    return { success: true };
  } catch (error) {
    if (isAppError(error)) return { error: error.message };
    console.error("[archiveFeeStructureAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }
}