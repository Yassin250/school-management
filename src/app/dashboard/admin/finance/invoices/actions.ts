"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/session";
import {
  generateInvoiceForStudent,
  issueInvoice,
  cancelInvoice,
} from "@/lib/services/finance/invoices";
import { isAppError } from "@/lib/errors";

export interface ActionResult {
  error?: string;
  success?: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
}

// ------------------------------------------------------------
// generateInvoiceAction
// ------------------------------------------------------------

export async function generateInvoiceAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireCurrentUser();

  const studentId = String(formData.get("studentId") ?? "");
  const academicYearId = String(formData.get("academicYearId") ?? "");
  const termId = String(formData.get("termId") ?? "");
  const dueDate = String(formData.get("dueDate") ?? "");
  const notesRaw = formData.get("notes");

  try {
    const result = await generateInvoiceForStudent(user, {
      studentId,
      academicYearId,
      termId,
      dueDate,
      notes:
        typeof notesRaw === "string" && notesRaw.trim() !== ""
          ? notesRaw.trim()
          : undefined,
    });

    revalidatePath("/dashboard/admin/finance/invoices");
    return {
      success: true,
      invoiceId: result.id,
      invoiceNumber: result.invoiceNumber,
    };
  } catch (error) {
    if (isAppError(error)) return { error: error.message };
    console.error("[generateInvoiceAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }
}

// ------------------------------------------------------------
// issueInvoiceAction
// ------------------------------------------------------------

export async function issueInvoiceAction(
  invoiceId: string,
): Promise<ActionResult> {
  const user = await requireCurrentUser();

  try {
    await issueInvoice(user, invoiceId);
    revalidatePath("/dashboard/admin/finance/invoices");
    revalidatePath(`/dashboard/admin/finance/invoices/${invoiceId}`);
    return { success: true };
  } catch (error) {
    if (isAppError(error)) return { error: error.message };
    console.error("[issueInvoiceAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }
}

// ------------------------------------------------------------
// cancelInvoiceAction
// ------------------------------------------------------------

export async function cancelInvoiceAction(
  invoiceId: string,
  reason: string,
): Promise<ActionResult> {
  const user = await requireCurrentUser();

  try {
    await cancelInvoice(user, invoiceId, reason);
    revalidatePath("/dashboard/admin/finance/invoices");
    revalidatePath(`/dashboard/admin/finance/invoices/${invoiceId}`);
    return { success: true };
  } catch (error) {
    if (isAppError(error)) return { error: error.message };
    console.error("[cancelInvoiceAction] error", error);
    return { error: "Something went wrong. Please try again." };
  }
}