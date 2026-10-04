"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/session";
import { createFeeStructuresBulk } from "@/lib/services/finance/fee-bulk";
import { isAppError } from "@/lib/errors";
import type { FeeType } from "@prisma/client";

export interface BulkActionResult {
  error?: string;
  success?: boolean;
  created?: number;
  skipped?: number;
  skippedReasons?: Array<{ row: number; reason: string }>;
}

export async function createFeeStructuresBulkAction(
  formData: FormData,
): Promise<BulkActionResult> {
  const user = await requireCurrentUser();

  try {
    const baseName = String(formData.get("baseName") ?? "");
    const academicYearId = String(formData.get("academicYearId") ?? "");
    const termId = String(formData.get("termId") ?? "");
    const feeType = String(formData.get("feeType") ?? "") as FeeType;
    const isMandatoryRaw = formData.get("isMandatory");
    const description = formData.get("description");

    const isMandatory =
      isMandatoryRaw === "on" || isMandatoryRaw === "true";

    // Rows come as: rows[i][educationLevelId] | rows[i][tradeId] | rows[i][amount]
    const rows: Array<{
      educationLevelId?: string | null;
      tradeId?: string | null;
      amount: number;
    }> = [];

    // Read how many rows were submitted via a hidden field
    const rowCountRaw = formData.get("rowCount");
    const rowCount = Number(rowCountRaw ?? "0");

    for (let i = 0; i < rowCount; i++) {
      const levelId = formData.get(`rows[${i}][educationLevelId]`);
      const tradeId = formData.get(`rows[${i}][tradeId]`);
      const amountRaw = formData.get(`rows[${i}][amount]`);

      const amount = Number(amountRaw);

      rows.push({
        educationLevelId:
          typeof levelId === "string" && levelId.trim() !== ""
            ? levelId
            : null,
        tradeId:
          typeof tradeId === "string" && tradeId.trim() !== ""
            ? tradeId
            : null,
        amount,
      });
    }

    const result = await createFeeStructuresBulk(user, {
      baseName,
      academicYearId,
      termId,
      feeType,
      isMandatory,
      description:
        typeof description === "string" && description.trim() !== ""
          ? description.trim()
          : null,
      rows,
    });

    revalidatePath("/dashboard/admin/finance/fee-structures");

    return {
      success: true,
      created: result.created,
      skipped: result.skipped,
      skippedReasons: result.skippedReasons,
    };
  } catch (error) {
    if (isAppError(error)) return { error: error.message };
    console.error("[createFeeStructuresBulkAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }
}