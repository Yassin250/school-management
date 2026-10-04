"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/session";
import { recordPayment } from "@/lib/services/finance/payments";
import { isAppError } from "@/lib/errors";
import type { PaymentMethod } from "@prisma/client";

export interface PaymentActionResult {
  error?: string;
  success?: boolean;
  paymentNumber?: string;
  invoiceStatus?: string;
  invoiceBalance?: string;
}

export async function recordPaymentAction(
  formData: FormData,
): Promise<PaymentActionResult> {
  const user = await requireCurrentUser();

  const invoiceId = String(formData.get("invoiceId") ?? "");
  const amountRaw = formData.get("amount");
  const method = String(formData.get("method") ?? "") as PaymentMethod;
  const reference = formData.get("reference");
  const payerId = formData.get("payerId");
  const notes = formData.get("notes");

  const amount = Number(amountRaw);

  try {
    const result = await recordPayment(user, {
      invoiceId,
      amount,
      method,
      reference:
        typeof reference === "string" && reference.trim() !== ""
          ? reference.trim()
          : null,
      payerId:
        typeof payerId === "string" && payerId.trim() !== ""
          ? payerId.trim()
          : null,
      notes:
        typeof notes === "string" && notes.trim() !== ""
          ? notes.trim()
          : null,
    });

    revalidatePath(`/dashboard/admin/finance/invoices/${invoiceId}`);
    revalidatePath("/dashboard/admin/finance/invoices");

    return {
      success: true,
      paymentNumber: result.paymentNumber,
      invoiceStatus: result.invoiceStatus,
      invoiceBalance: result.invoiceBalance,
    };
  } catch (error) {
    if (isAppError(error)) return { error: error.message };
    console.error("[recordPaymentAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }
}