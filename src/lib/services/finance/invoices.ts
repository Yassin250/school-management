// ============================================================
// Finance — Invoice Service
// ============================================================
// Generates and manages student invoices for a specific term.
// One invoice per (student, academic year, term).
//
// Invoice items are derived from active FeeStructure rows that
// apply to the student's level (or trade) and the same term.
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
import type { InvoiceStatus } from "@prisma/client";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  className: string;
  termName: string;
  academicYearName: string;
  status: InvoiceStatus;
  totalAmount: string;
  paidAmount: string;
  balance: string;
  dueDate: Date;
  issueDate: Date;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  amount: string;
  feeStructureId: string | null;
}

export interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  subtotal: string;
  discountTotal: string;
  totalAmount: string;
  paidAmount: string;
  balance: string;
  notes: string | null;
  student: {
    id: string;
    studentCode: string;
    firstName: string;
    lastName: string;
  };
  class: {
    id: string;
    name: string;
  };
  academicYear: {
    id: string;
    name: string;
  };
  term: {
    id: string;
    name: string;
  };
  items: InvoiceLineItem[];
}

// ------------------------------------------------------------
// Internal — invoice number generation
// ------------------------------------------------------------
// Format: INV-<year>-T<n>-<sequence>
// e.g., INV-2026-T1-0001

async function generateInvoiceNumber(
  academicYearId: string,
  termId: string,
): Promise<string> {
  const year = await prisma.academicYear.findUnique({
    where: { id: academicYearId },
    select: { name: true },
  });
  if (!year) throw new ValidationError("Academic year not found.");

  const term = await prisma.term.findUnique({
    where: { id: termId },
    select: { name: true },
  });
  if (!term) throw new ValidationError("Term not found.");

  // Extract year digits (e.g., "2026/2027" → "2026")
  const yearDigits = year.name.replace(/[^0-9]/g, "").slice(0, 4);

  // Extract term number (e.g., "Term 1" → "T1")
  const termMatch = term.name.match(/\d+/);
  const termDigit = termMatch ? `T${termMatch[0]}` : "T0";

  const prefix = `INV-${yearDigits}-${termDigit}-`;

  // Find the highest existing sequence for this prefix
  const last = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  let nextSeq = 1;
  if (last) {
    const parts = last.invoiceNumber.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  return `${prefix}${nextSeq.toString().padStart(4, "0")}`;
}

// ------------------------------------------------------------
// generateInvoiceForStudent
// ------------------------------------------------------------
// Creates a term-scoped invoice for one student. Fails if an
// invoice already exists for (student, academicYear, term).

export async function generateInvoiceForStudent(
  actor: CurrentUser,
  input: {
    studentId: string;
    academicYearId: string;
    termId: string;
    dueDate: string;
    notes?: string;
  },
): Promise<{ id: string; invoiceNumber: string }> {
  const allowed = await canForUser(actor, "invoices.create");
  if (!allowed) throw new ForbiddenError("invoices.create");

  const { studentId, academicYearId, termId, dueDate, notes } = input;

  if (!studentId || !academicYearId || !termId) {
    throw new ValidationError(
      "Student, academic year, and term are required.",
    );
  }

  if (!dueDate) {
    throw new ValidationError("Due date is required.");
  }

  // 1. Verify the term belongs to the academic year
  const term = await prisma.term.findUnique({
    where: { id: termId },
    select: { id: true, academicYearId: true },
  });
  if (!term) throw new NotFoundError("Term", termId);
  if (term.academicYearId !== academicYearId) {
    throw new ValidationError(
      "The selected term does not belong to the selected academic year.",
    );
  }

  // 2. Load the student's active enrollment for this year
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_academicYearId: { studentId, academicYearId },
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      class: { select: { id: true, name: true } },
      educationLevel: { select: { id: true, name: true } },
      trade: { select: { id: true, name: true } },
    },
  });
  if (!enrollment) {
    throw new ValidationError(
      "Student is not enrolled for the selected academic year.",
    );
  }
  if (enrollment.status !== "ACTIVE") {
    throw new ValidationError(
      "Student's enrollment is not active for this academic year.",
    );
  }

  // 3. Check for an existing invoice
  const existing = await prisma.invoice.findFirst({
    where: { studentId, academicYearId, termId },
    select: { id: true, invoiceNumber: true },
  });
  if (existing) {
    throw new ConflictError(
      `An invoice already exists for this student for this term (${existing.invoiceNumber}).`,
    );
  }

  // 4. Find applicable fee structures
  const feeStructures = await prisma.feeStructure.findMany({
    where: {
      academicYearId,
      termId,
      isActive: true,
      OR: [
        { educationLevelId: enrollment.educationLevelId },
        ...(enrollment.tradeId ? [{ tradeId: enrollment.tradeId }] : []),
      ],
    },
    orderBy: { name: "asc" },
  });

  if (feeStructures.length === 0) {
    throw new ValidationError(
      "No active fee structures apply to this student for the selected term.",
    );
  }

  // 5. Compute totals
  const subtotal = feeStructures.reduce(
    (sum, fs) => sum + Number(fs.amount),
    0,
  );
  const totalAmount = subtotal; // no discounts yet
  const balance = totalAmount; // no payments yet

  // 6. Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(
    academicYearId,
    termId,
  );

  // 7. Create invoice + items + audit in a transaction
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        studentId,
        academicYearId,
        termId,
        status: "DRAFT",
        dueDate: new Date(dueDate),
        subtotal,
        discountTotal: 0,
        totalAmount,
        paidAmount: 0,
        balance,
        notes: notes?.trim() || null,
        items: {
          create: feeStructures.map((fs) => ({
            feeStructureId: fs.id,
            description: fs.name,
            amount: fs.amount,
          })),
        },
      },
    });

    await logAudit({
      actorId: actor.id,
      action: "INVOICE_CREATED",
      entity: "Invoice",
      entityId: invoice.id,
      description: `Created invoice ${invoiceNumber} for ${enrollment.student.firstName} ${enrollment.student.lastName}`,
      newValue: {
        invoiceNumber,
        studentId,
        academicYearId,
        termId,
        totalAmount,
        itemCount: feeStructures.length,
      },
      tx,
    });

    return { id: invoice.id, invoiceNumber };
  });
}

// ------------------------------------------------------------
// listInvoices
// ------------------------------------------------------------

export async function listInvoices(
  actor: CurrentUser,
  filters: {
    academicYearId?: string;
    termId?: string;
    status?: InvoiceStatus;
    studentId?: string;
  } = {},
): Promise<InvoiceListItem[]> {
  const allowed = await canForUser(actor, "invoices.read");
  if (!allowed) throw new ForbiddenError("invoices.read");

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(filters.academicYearId
        ? { academicYearId: filters.academicYearId }
        : {}),
      ...(filters.termId ? { termId: filters.termId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.studentId ? { studentId: filters.studentId } : {}),
    },
    include: {
      student: {
        select: { studentCode: true, firstName: true, lastName: true },
      },
      academicYear: { select: { name: true } },
      term: { select: { name: true } },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 200,
  });

  // Load class info per student via enrollment
  const studentIds = [...new Set(invoices.map((i) => i.studentId))];
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: { in: studentIds },
      status: "ACTIVE",
    },
    select: {
      studentId: true,
      class: { select: { name: true } },
    },
  });
  const classByStudent = new Map(
    enrollments.map((e) => [e.studentId, e.class.name]),
  );

  return invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    studentId: inv.studentId,
    studentCode: inv.student.studentCode,
    studentName: `${inv.student.firstName} ${inv.student.lastName}`,
    className: classByStudent.get(inv.studentId) ?? "-",
    termName: inv.term?.name ?? "-",
    academicYearName: inv.academicYear.name,
    status: inv.status,
    totalAmount: inv.totalAmount.toString(),
    paidAmount: inv.paidAmount.toString(),
    balance: inv.balance.toString(),
    dueDate: inv.dueDate,
    issueDate: inv.issueDate,
  }));
}

// ------------------------------------------------------------
// getInvoiceDetail
// ------------------------------------------------------------

export async function getInvoiceDetail(
  actor: CurrentUser,
  invoiceId: string,
): Promise<InvoiceDetail> {
  const allowed = await canForUser(actor, "invoices.read");
  if (!allowed) throw new ForbiddenError("invoices.read");

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      student: {
        select: {
          id: true,
          studentCode: true,
          firstName: true,
          lastName: true,
        },
      },
      academicYear: { select: { id: true, name: true } },
      term: { select: { id: true, name: true } },
      items: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!invoice) throw new NotFoundError("Invoice", invoiceId);

  // Load class
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: invoice.studentId,
      academicYearId: invoice.academicYearId,
    },
    select: { class: { select: { id: true, name: true } } },
  });

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    subtotal: invoice.subtotal.toString(),
    discountTotal: invoice.discountTotal.toString(),
    totalAmount: invoice.totalAmount.toString(),
    paidAmount: invoice.paidAmount.toString(),
    balance: invoice.balance.toString(),
    notes: invoice.notes,
    student: invoice.student,
    class: enrollment?.class ?? { id: "", name: "-" },
    academicYear: invoice.academicYear,
    term: invoice.term ?? { id: "", name: "-" },
    items: invoice.items.map((it) => ({
      id: it.id,
      description: it.description,
      amount: it.amount.toString(),
      feeStructureId: it.feeStructureId,
    })),
  };
}

// ------------------------------------------------------------
// issueInvoice
// ------------------------------------------------------------
// Moves DRAFT → ISSUED. Once issued, the invoice is visible to
// parents/students and cannot be edited (except cancellations).

export async function issueInvoice(
  actor: CurrentUser,
  invoiceId: string,
) {
  const allowed = await canForUser(actor, "invoices.update");
  if (!allowed) throw new ForbiddenError("invoices.update");

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, status: true, invoiceNumber: true },
  });
  if (!invoice) throw new NotFoundError("Invoice", invoiceId);
  if (invoice.status !== "DRAFT") {
    throw new ConflictError(
      `Cannot issue invoice in state ${invoice.status}. Only DRAFT invoices can be issued.`,
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: "ISSUED", issueDate: new Date() },
    });

    await logAudit({
      actorId: actor.id,
      action: "INVOICE_UPDATED",
      entity: "Invoice",
      entityId: invoiceId,
      description: `Issued invoice ${invoice.invoiceNumber}`,
      previousValue: { status: "DRAFT" },
      newValue: { status: "ISSUED" },
      tx,
    });

    return updated;
  });
}

// ------------------------------------------------------------
// cancelInvoice
// ------------------------------------------------------------

export async function cancelInvoice(
  actor: CurrentUser,
  invoiceId: string,
  reason: string,
) {
  const allowed = await canForUser(actor, "invoices.cancel");
  if (!allowed) throw new ForbiddenError("invoices.cancel");

  if (!reason || reason.trim().length < 5) {
    throw new ValidationError("A reason of at least 5 characters is required.");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, status: true, invoiceNumber: true, paidAmount: true },
  });
  if (!invoice) throw new NotFoundError("Invoice", invoiceId);
  if (invoice.status === "CANCELLED") {
    throw new ConflictError("Invoice is already cancelled.");
  }
  if (Number(invoice.paidAmount) > 0) {
    throw new ConflictError(
      "Cannot cancel an invoice that has payments. Refund first.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: "CANCELLED", notes: reason.trim() },
    });

    await logAudit({
      actorId: actor.id,
      action: "INVOICE_CANCELLED",
      entity: "Invoice",
      entityId: invoiceId,
      description: `Cancelled invoice ${invoice.invoiceNumber}: ${reason.trim()}`,
      previousValue: { status: invoice.status },
      newValue: { status: "CANCELLED" },
      tx,
    });

    return updated;
  });
}

// ------------------------------------------------------------
// Helpers used by the UI
// ------------------------------------------------------------

export async function listTermsForPicker(actor: CurrentUser) {
  const allowed = await canForUser(actor, "invoices.read");
  if (!allowed) throw new ForbiddenError("invoices.read");

  return prisma.term.findMany({
    select: {
      id: true,
      name: true,
      isCurrent: true,
      academicYearId: true,
      academicYear: { select: { name: true } },
    },
    orderBy: [
      { academicYear: { name: "desc" } },
      { startDate: "asc" },
    ],
  });
}

export async function listActiveStudentsForTerm(
  actor: CurrentUser,
  academicYearId: string,
) {
  const allowed = await canForUser(actor, "invoices.read");
  if (!allowed) throw new ForbiddenError("invoices.read");

  return prisma.enrollment.findMany({
    where: {
      academicYearId,
      status: "ACTIVE",
    },
    include: {
      student: {
        select: {
          id: true,
          studentCode: true,
          firstName: true,
          lastName: true,
        },
      },
      class: { select: { id: true, name: true } },
    },
    orderBy: [
      { class: { name: "asc" } },
      { student: { lastName: "asc" } },
    ],
  });
}