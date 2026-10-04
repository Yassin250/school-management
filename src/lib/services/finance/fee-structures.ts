// ============================================================
// Finance — Fee Structures Service
// ============================================================
// Admin/Accountant defines fees per academic year and education
// level (or trade for TVET). Read for admins; write for
// ACCOUNTANT and SCHOOL_ADMIN.
// ============================================================

import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { logAudit } from "@/lib/audit/audit";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";
import type { FeeType } from "@prisma/client";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface FeeStructureListItem {
  id: string;
  name: string;
  feeType: FeeType;
  amount: string;
  isMandatory: boolean;
  isActive: boolean;
  description: string | null;
  academicYearId: string;
  academicYearName: string;
  educationLevelId: string | null;
  educationLevelName: string | null;
  tradeId: string | null;
  tradeName: string | null;
  invoiceItemCount: number;
}

export interface CreateFeeStructureInput {
  name: string;
  academicYearId: string;
  educationLevelId?: string | null;
  tradeId?: string | null;
  feeType: FeeType;
  amount: number;
  isMandatory?: boolean;
  description?: string | null;
}

// ------------------------------------------------------------
// listFeeStructures
// ------------------------------------------------------------
// Returns all fee structures for a given academic year (or all
// years if none given). Includes counts of invoices using them.

export async function listFeeStructures(
  actor: CurrentUser,
  options: { academicYearId?: string; includeInactive?: boolean } = {},
): Promise<FeeStructureListItem[]> {
  const allowed = await canForUser(actor, "fee_structures.read");
  if (!allowed) throw new ForbiddenError("fee_structures.read");

  const { academicYearId, includeInactive = false } = options;

  const rows = await prisma.feeStructure.findMany({
    where: {
      ...(academicYearId ? { academicYearId } : {}),
      ...(includeInactive ? {} : { isActive: true }),
    },
    include: {
      academicYear: { select: { name: true } },
      educationLevel: { select: { name: true } },
      trade: { select: { name: true } },
      _count: {
        select: { invoiceItems: true },
      },
    },
    orderBy: [
      { academicYear: { name: "desc" } },
      { educationLevel: { order: "asc" } },
      { name: "asc" },
    ],
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    feeType: r.feeType,
    amount: r.amount.toString(),
    isMandatory: r.isMandatory,
    isActive: r.isActive,
    description: r.description,
    academicYearId: r.academicYearId,
    academicYearName: r.academicYear.name,
    educationLevelId: r.educationLevelId,
    educationLevelName: r.educationLevel?.name ?? null,
    tradeId: r.tradeId,
    tradeName: r.trade?.name ?? null,
    invoiceItemCount: r._count.invoiceItems,
  }));
}

// ------------------------------------------------------------
// createFeeStructure
// ------------------------------------------------------------

export async function createFeeStructure(
  actor: CurrentUser,
  input: CreateFeeStructureInput,
) {
  const allowed = await canForUser(actor, "fee_structures.create");
  if (!allowed) throw new ForbiddenError("fee_structures.create");

  // ----------------------------------------------------------
  // Validation
  // ----------------------------------------------------------

  const trimmedName = input.name?.trim();
  if (!trimmedName || trimmedName.length < 2) {
    throw new ValidationError("Name must be at least 2 characters.");
  }

  if (!input.academicYearId) {
    throw new ValidationError("Academic year is required.");
  }

  if (!input.feeType) {
    throw new ValidationError("Fee type is required.");
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new ValidationError("Amount must be a positive number.");
  }

  // Must target exactly one of education level OR trade
  const hasLevel = Boolean(input.educationLevelId);
  const hasTrade = Boolean(input.tradeId);
  if (hasLevel && hasTrade) {
    throw new ValidationError(
      "A fee structure must target either an education level or a trade, not both.",
    );
  }
  if (!hasLevel && !hasTrade) {
    throw new ValidationError(
      "A fee structure must target an education level or a trade.",
    );
  }

  // Verify academic year exists
  const year = await prisma.academicYear.findUnique({
    where: { id: input.academicYearId },
    select: { id: true },
  });
  if (!year) {
    throw new ValidationError("Academic year not found.");
  }

  // Verify education level exists
  if (input.educationLevelId) {
    const level = await prisma.educationLevel.findUnique({
      where: { id: input.educationLevelId },
      select: { id: true },
    });
    if (!level) {
      throw new ValidationError("Education level not found.");
    }
  }

  // Verify trade exists
  if (input.tradeId) {
    const trade = await prisma.trade.findUnique({
      where: { id: input.tradeId },
      select: { id: true },
    });
    if (!trade) {
      throw new ValidationError("Trade not found.");
    }
  }

  // ----------------------------------------------------------
  // Create + audit in transaction
  // ----------------------------------------------------------

  return prisma.$transaction(async (tx) => {
    const created = await tx.feeStructure.create({
      data: {
        name: trimmedName,
        academicYearId: input.academicYearId,
        educationLevelId: input.educationLevelId ?? null,
        tradeId: input.tradeId ?? null,
        feeType: input.feeType,
        amount: input.amount,
        isMandatory: input.isMandatory ?? true,
        description: input.description?.trim() || null,
        isActive: true,
      },
    });

    await logAudit({
      actorId: actor.id,
      action: "FEE_STRUCTURE_CREATED",
      entity: "FeeStructure",
      entityId: created.id,
      description: `Created fee structure "${trimmedName}"`,
      newValue: {
        name: trimmedName,
        feeType: input.feeType,
        amount: input.amount,
        academicYearId: input.academicYearId,
        educationLevelId: input.educationLevelId ?? null,
        tradeId: input.tradeId ?? null,
      },
      tx,
    });

    return created;
  });
}

// ------------------------------------------------------------
// archiveFeeStructure
// ------------------------------------------------------------
// Soft-archives a fee structure. Fails if it's already used on
// any invoice — historical invoices must keep their fee link.

export async function archiveFeeStructure(
  actor: CurrentUser,
  feeStructureId: string,
) {
  const allowed = await canForUser(actor, "fee_structures.archive");
  if (!allowed) throw new ForbiddenError("fee_structures.archive");

  const feeStructure = await prisma.feeStructure.findUnique({
    where: { id: feeStructureId },
    include: {
      _count: { select: { invoiceItems: true } },
    },
  });

  if (!feeStructure) {
    throw new NotFoundError("FeeStructure", feeStructureId);
  }

  if (feeStructure._count.invoiceItems > 0) {
    throw new ValidationError(
      `Cannot archive: this fee structure is used on ${feeStructure._count.invoiceItems} invoice(s).`,
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.feeStructure.update({
      where: { id: feeStructureId },
      data: { isActive: false },
    });

    await logAudit({
      actorId: actor.id,
      action: "FEE_STRUCTURE_UPDATED",
      entity: "FeeStructure",
      entityId: feeStructureId,
      description: `Archived fee structure "${feeStructure.name}"`,
      previousValue: { isActive: true },
      newValue: { isActive: false },
      tx,
    });

    return updated;
  });
}

// ------------------------------------------------------------
// Helpers used by the UI
// ------------------------------------------------------------

export async function listAcademicYearsForPicker(actor: CurrentUser) {
  const allowed = await canForUser(actor, "fee_structures.read");
  if (!allowed) throw new ForbiddenError("fee_structures.read");

  return prisma.academicYear.findMany({
    select: { id: true, name: true, isCurrent: true },
    orderBy: { name: "desc" },
  });
}

export async function listEducationLevelsForPicker(actor: CurrentUser) {
  const allowed = await canForUser(actor, "fee_structures.read");
  if (!allowed) throw new ForbiddenError("fee_structures.read");

  return prisma.educationLevel.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, area: true, order: true },
    orderBy: { order: "asc" },
  });
}

export async function listTradesForPicker(actor: CurrentUser) {
  const allowed = await canForUser(actor, "fee_structures.read");
  if (!allowed) throw new ForbiddenError("fee_structures.read");

  return prisma.trade.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });
}