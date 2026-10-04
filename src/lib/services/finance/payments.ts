// ============================================================
// Finance — Payment Service
// ============================================================
// Records payments against invoices. Supports partial payments.
// After each payment, the invoice's paidAmount, balance, and
// status are recomputed atomically in the same transaction.
// ============================================================

import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { logAudit } from "@/lib/audit/audit";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";
import type { PaymentMethod, PaymentStatus } from "@prisma/client";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface PaymentListItem {
  id: string;
  paymentNumber: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  paidAt: Date;
  recordedByName: string;
  notes: string | null;
}

export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  payerId?: string | null;
  notes?: string | null;
}

// ------------------------------------------------------------
// Internal — payment number generation
// ------------------------------------------------------------
// Format: PAY-<year>-T<n>-<sequence>
// e.g., PAY-2026-T1-0001

async function generatePaymentNumber(
  academicYearId: string,
  termId: string | null,
): Promise<string> {
  const year = await prisma.academicYear.findUnique({
    where: { id: academicYearId },
    select: { name: true },
  });
  if (!year) throw new ValidationError("Academic year not found.");

  const yearDigits = year.name.replace(/[^0-9]/g, "").slice(0, 4);

  let termPart = "T0";
  if (termId) {
    const term = await prisma.term.findUnique({
      where: { id: termId },
      select: { name: true },
    });
    if (term) {
      const m = term.name.match(/\d+/);
      if (m) termPart = `T${m[0]}`;
    }
  }

  const prefix = `PAY-${yearDigits}-${termPart}-`;

  const last = await prisma.payment.findFirst({
    where: { paymentNumber: { startsWith: prefix } },
    orderBy: { paymentNumber: "desc" },
    select: { paymentNumber: true },
  });

  let nextSeq = 1;
  if (last) {
    const parts = last.paymentNumber.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  return `${prefix}${nextSeq.toString().padStart(4, "0")}`;
}

// ------------------------------------------------------------
// recordPayment
// ------------------------------------------------------------
// Records a completed payment. Recomputes invoice totals.

export async function recordPayment(
  actor: CurrentUser,
  input: RecordPaymentInput,
): Promise<{
  id: string;
  paymentNumber: string;
  invoiceStatus: string;
  invoiceBalance: string;
}> {
  const allowed = await canForUser(actor, "payments.create");
  if (!allowed) throw new ForbiddenError("payments.create");

  const { invoiceId, amount, method, reference, payerId, notes } = input;

  // ----------------------------------------------------------
  // Validation
  // ----------------------------------------------------------

  if (!invoiceId) throw new ValidationError("Invoice is required.");

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError("Amount must be a positive number.");
  }

  if (!method) throw new ValidationError("Payment method is required.");

  // Load the invoice with its current state
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      studentId: true,
      academicYearId: true,
      termId: true,
      totalAmount: true,
      paidAmount: true,
      balance: true,
    },
  });

  if (!invoice) throw new NotFoundError("Invoice", invoiceId);

  if (invoice.status === "CANCELLED") {
    throw new ConflictError(
      `Cannot record payment: invoice ${invoice.invoiceNumber} is cancelled.`,
    );
  }

  if (invoice.status === "DRAFT") {
    throw new ConflictError(
      `Cannot record payment: invoice ${invoice.invoiceNumber} has not been issued yet.`,
    );
  }

  if (invoice.status === "PAID") {
    throw new ConflictError(
      `Cannot record payment: invoice ${invoice.invoiceNumber} is already paid.`,
    );
  }

  // Reject overpayment (Decision 3 — Option C: no overpayments)
  const balanceNum = Number(invoice.balance);
  if (amount > balanceNum) {
    throw new ValidationError(
      `Payment exceeds the invoice balance of ${balanceNum.toLocaleString("en-RW")} RWF. Record ${balanceNum} or less.`,
    );
  }

  // Verify payer (if provided) belongs to the student
  if (payerId) {
    const link = await prisma.parentStudent.findFirst({
      where: { parentId: payerId, studentId: invoice.studentId },
      select: { id: true },
    });
    if (!link) {
      throw new ValidationError(
        "Selected payer is not linked to the student on this invoice.",
      );
    }
  }

  // ----------------------------------------------------------
  // Transaction
  // ----------------------------------------------------------

  return prisma.$transaction(async (tx) => {
    const paymentNumber = await generatePaymentNumber(
      invoice.academicYearId,
      invoice.termId,
    );

    const payment = await tx.payment.create({
      data: {
        paymentNumber,
        invoiceId,
        studentId: invoice.studentId,
        payerId: payerId ?? null,
        amount,
        method,
        status: "COMPLETED",
        reference: reference?.trim() || null,
        recordedById: actor.id,
        notes: notes?.trim() || null,
      },
    });

    // Recompute invoice totals
    const newPaidAmount = Number(invoice.paidAmount) + amount;
    const newBalance = Number(invoice.totalAmount) - newPaidAmount;

    const newStatus =
      newBalance <= 0
        ? "PAID"
        : newPaidAmount > 0
          ? "PARTIALLY_PAID"
          : invoice.status;

    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        balance: newBalance,
        status: newStatus,
      },
    });

    await logAudit({
      actorId: actor.id,
      action: "PAYMENT_CREATED",
      entity: "Payment",
      entityId: payment.id,
      description: `Payment ${paymentNumber} of ${amount.toLocaleString("en-RW")} RWF against ${invoice.invoiceNumber}`,
      newValue: {
        paymentNumber,
        invoiceId,
        amount,
        method,
        invoiceStatusAfter: newStatus,
        invoiceBalanceAfter: newBalance,
      },
      tx,
    });

    return {
      id: payment.id,
      paymentNumber,
      invoiceStatus: newStatus,
      invoiceBalance: newBalance.toString(),
    };
  });
}

// ------------------------------------------------------------
// listPaymentsForInvoice
// ------------------------------------------------------------

export async function listPaymentsForInvoice(
  actor: CurrentUser,
  invoiceId: string,
): Promise<PaymentListItem[]> {
  const allowed = await canForUser(actor, "payments.read");
  if (!allowed) throw new ForbiddenError("payments.read");

  const payments = await prisma.payment.findMany({
    where: { invoiceId, status: "COMPLETED" },
    include: {
      recordedBy: { select: { username: true } },
    },
    orderBy: { paidAt: "asc" },
  });

  return payments.map((p) => ({
    id: p.id,
    paymentNumber: p.paymentNumber,
    amount: p.amount.toString(),
    method: p.method,
    status: p.status,
    reference: p.reference,
    paidAt: p.paidAt,
    recordedByName: p.recordedBy.username,
    notes: p.notes,
  }));
}

// ------------------------------------------------------------
// listPayments (global)
// ------------------------------------------------------------

export async function listPayments(
  actor: CurrentUser,
  filters: {
    academicYearId?: string;
    studentId?: string;
    fromDate?: Date;
    toDate?: Date;
    method?: PaymentMethod;
  } = {},
): Promise<
  Array<PaymentListItem & { studentName: string; invoiceNumber: string }>
> {
  const allowed = await canForUser(actor, "payments.read");
  if (!allowed) throw new ForbiddenError("payments.read");

  const payments = await prisma.payment.findMany({
    where: {
      status: "COMPLETED",
      ...(filters.studentId ? { studentId: filters.studentId } : {}),
      ...(filters.method ? { method: filters.method } : {}),
      ...(filters.fromDate || filters.toDate
        ? {
            paidAt: {
              ...(filters.fromDate ? { gte: filters.fromDate } : {}),
              ...(filters.toDate ? { lte: filters.toDate } : {}),
            },
          }
        : {}),
      ...(filters.academicYearId
        ? { invoice: { academicYearId: filters.academicYearId } }
        : {}),
    },
    include: {
      recordedBy: { select: { username: true } },
      student: { select: { firstName: true, lastName: true } },
      invoice: { select: { invoiceNumber: true } },
    },
    orderBy: { paidAt: "desc" },
    take: 500,
  });

  return payments.map((p) => ({
    id: p.id,
    paymentNumber: p.paymentNumber,
    amount: p.amount.toString(),
    method: p.method,
    status: p.status,
    reference: p.reference,
    paidAt: p.paidAt,
    recordedByName: p.recordedBy.username,
    notes: p.notes,
    studentName: `${p.student.firstName} ${p.student.lastName}`,
    invoiceNumber: p.invoice.invoiceNumber,
  }));
}

// ------------------------------------------------------------
// Helper — list parents linked to a student (for the form)
// ------------------------------------------------------------

export async function listParentsForStudent(
  actor: CurrentUser,
  studentId: string,
) {
  const allowed = await canForUser(actor, "payments.create");
  if (!allowed) throw new ForbiddenError("payments.create");

  const links = await prisma.parentStudent.findMany({
    where: { studentId },
    include: {
      parent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
    orderBy: { isPrimary: "desc" },
  });

  return links.map((l) => ({
    id: l.parent.id,
    firstName: l.parent.firstName,
    lastName: l.parent.lastName,
    phone: l.parent.phone,
    relationship: l.relationship ?? "Guardian",
    isPrimary: l.isPrimary,
  }));
}