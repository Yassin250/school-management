// ============================================================
// Finance — Bulk Fee Structure Creation
// ============================================================
// Creates multiple fee structures in a single transaction.
// Skips duplicates (same academic year, term, level/trade, fee type).
// Returns a summary of created vs skipped.
// ============================================================

import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { logAudit } from "@/lib/audit/audit";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";
import type { FeeType } from "@prisma/client";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface BulkFeeRow {
  educationLevelId?: string | null;
  tradeId?: string | null;
  amount: number;
}

export interface BulkCreateInput {
  baseName: string;
  academicYearId: string;
  termId: string;
  feeType: FeeType;
  isMandatory?: boolean;
  description?: string | null;
  rows: BulkFeeRow[];
}

export interface BulkCreateResult {
  created: number;
  skipped: number;
  skippedReasons: Array<{ row: number; reason: string }>;
  createdIds: string[];
}

// ------------------------------------------------------------
// createFeeStructuresBulk
// ------------------------------------------------------------

export async function createFeeStructuresBulk(
  actor: CurrentUser,
  input: BulkCreateInput,
): Promise<BulkCreateResult> {
  const allowed = await canForUser(actor, "fee_structures.create");
  if (!allowed) throw new ForbiddenError("fee_structures.create");

  const {
    baseName,
    academicYearId,
    termId,
    feeType,
    isMandatory = true,
    description,
    rows,
  } = input;

  // ----------------------------------------------------------
  // Validation
  // ----------------------------------------------------------

  const trimmedBaseName = baseName?.trim();
  if (!trimmedBaseName || trimmedBaseName.length < 2) {
    throw new ValidationError("Base name must be at least 2 characters.");
  }

  if (!academicYearId) {
    throw new ValidationError("Academic year is required.");
  }

  if (!termId) {
    throw new ValidationError("Term is required.");
  }

  if (!feeType) {
    throw new ValidationError("Fee type is required.");
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new ValidationError("At least one row is required.");
  }

  // Verify academic year + term
  const year = await prisma.academicYear.findUnique({
    where: { id: academicYearId },
    select: { id: true, name: true },
  });
  if (!year) throw new ValidationError("Academic year not found.");

  const term = await prisma.term.findUnique({
    where: { id: termId },
    select: { id: true, name: true, academicYearId: true },
  });
  if (!term) throw new ValidationError("Term not found.");
  if (term.academicYearId !== academicYearId) {
    throw new ValidationError(
      "The selected term does not belong to the selected academic year.",
    );
  }

  // ----------------------------------------------------------
  // Load lookup data (levels + trades)
  // ----------------------------------------------------------

  const levelIds = rows
    .map((r) => r.educationLevelId)
    .filter((x): x is string => Boolean(x));
  const tradeIds = rows
    .map((r) => r.tradeId)
    .filter((x): x is string => Boolean(x));

  const [levels, trades] = await Promise.all([
    prisma.educationLevel.findMany({
      where: { id: { in: levelIds } },
      select: { id: true, code: true, name: true },
    }),
    prisma.trade.findMany({
      where: { id: { in: tradeIds } },
      select: { id: true, code: true, name: true },
    }),
  ]);

  const levelById = new Map(levels.map((l) => [l.id, l]));
  const tradeById = new Map(trades.map((t) => [t.id, t]));

  // ----------------------------------------------------------
  // Find existing fee structures to skip
  // ----------------------------------------------------------

  const existing = await prisma.feeStructure.findMany({
    where: {
      academicYearId,
      termId,
      feeType,
      OR: [
        ...(levelIds.length > 0
          ? [{ educationLevelId: { in: levelIds } }]
          : []),
        ...(tradeIds.length > 0 ? [{ tradeId: { in: tradeIds } }] : []),
      ],
    },
    select: {
      educationLevelId: true,
      tradeId: true,
    },
  });

  const existingKeys = new Set(
    existing.map((e) =>
      e.educationLevelId
        ? `level:${e.educationLevelId}`
        : `trade:${e.tradeId}`,
    ),
  );

  // ----------------------------------------------------------
  // Transaction
  // ----------------------------------------------------------

  const skippedReasons: Array<{ row: number; reason: string }> = [];

  const result = await prisma.$transaction(async (tx) => {
    const createdIds: string[] = [];
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      // Validate the row
      if (!row.educationLevelId && !row.tradeId) {
        skipped++;
        skippedReasons.push({
          row: rowNum,
          reason: "Row must target a level or a trade.",
        });
        continue;
      }
      if (row.educationLevelId && row.tradeId) {
        skipped++;
        skippedReasons.push({
          row: rowNum,
          reason: "Row cannot target both a level and a trade.",
        });
        continue;
      }
      if (!Number.isFinite(row.amount) || row.amount <= 0) {
        skipped++;
        skippedReasons.push({
          row: rowNum,
          reason: "Amount must be a positive number.",
        });
        continue;
      }

      // Verify the level or trade exists
      let label = "";
      if (row.educationLevelId) {
        const lvl = levelById.get(row.educationLevelId);
        if (!lvl) {
          skipped++;
          skippedReasons.push({
            row: rowNum,
            reason: `Education level ${row.educationLevelId} not found.`,
          });
          continue;
        }
        label = lvl.code;
      } else if (row.tradeId) {
        const trd = tradeById.get(row.tradeId);
        if (!trd) {
          skipped++;
          skippedReasons.push({
            row: rowNum,
            reason: `Trade ${row.tradeId} not found.`,
          });
          continue;
        }
        label = trd.name;
      }

      // Check for duplicates
      const key = row.educationLevelId
        ? `level:${row.educationLevelId}`
        : `trade:${row.tradeId}`;
      if (existingKeys.has(key)) {
        skipped++;
        skippedReasons.push({
          row: rowNum,
          reason: `A ${feeType} fee for ${label} already exists for this term.`,
        });
        continue;
      }

      // Create it
      const rowName = `${trimmedBaseName} — ${label}`;

      const created = await tx.feeStructure.create({
        data: {
          name: rowName,
          academicYearId,
          termId,
          educationLevelId: row.educationLevelId ?? null,
          tradeId: row.tradeId ?? null,
          feeType,
          amount: row.amount,
          isMandatory,
          description: description?.trim() || null,
          isActive: true,
        },
      });

      createdIds.push(created.id);

      // Reserve the key so subsequent duplicate rows in the same request are also skipped
      existingKeys.add(key);
    }

    // Audit — one entry for the whole batch
    if (createdIds.length > 0) {
      await logAudit({
        actorId: actor.id,
        action: "FEE_STRUCTURE_CREATED",
        entity: "FeeStructure",
        entityId: null,
        description: `Bulk created ${createdIds.length} fee structure(s) for ${feeType} — ${year.name} ${term.name}`,
        newValue: {
          bulk: true,
          count: createdIds.length,
          feeType,
          academicYearId,
          termId,
          createdIds,
        },
        tx,
      });
    }

    return {
      createdIds,
      created: createdIds.length,
      skipped,
    };
  });

  return {
    created: result.created,
    skipped: result.skipped,
    skippedReasons,
    createdIds: result.createdIds,
  };
}