// ============================================================
// Grade Scales Service
// ============================================================
// Configuration of the grading scales used to turn percentages
// into letter/competency symbols on report cards.
//
// Authorization: `grade_scales.*` is granted to SCHOOL_ADMIN only.
// SYSTEM_ADMIN keeps its existing read-only academic boundary and
// has no grade-scale permissions at all.
//
// Selection of the active scale at report-card time lives in
// `report-card.ts` (resolveActiveGradeScale), which requires exactly
// one active scale per education area.
// ============================================================

import type { EducationArea } from "@prisma/client";
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

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface GradeBandInput {
  minScore: number;
  maxScore: number;
  symbol: string;
  description?: string | null;
  points?: number | null;
  isPass?: boolean;
}

export interface GradeBandView {
  minScore: string;
  maxScore: string;
  symbol: string;
  description: string | null;
  points: string | null;
  isPass: boolean;
  order: number;
}

export interface GradeScaleListItem {
  id: string;
  name: string;
  educationArea: EducationArea;
  description: string | null;
  isActive: boolean;
  bandCount: number;
  reportCardCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GradeScaleDetail {
  id: string;
  name: string;
  educationArea: EducationArea;
  description: string | null;
  isActive: boolean;
  reportCardCount: number;
  usedSymbols: string[];
  bands: GradeBandView[];
}

export interface CreateGradeScaleInput {
  name: string;
  educationArea: EducationArea;
  description?: string | null;
  isActive?: boolean;
  bands: GradeBandInput[];
}

export interface UpdateGradeScaleInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
  bands?: GradeBandInput[];
}

// ------------------------------------------------------------
// Score precision
// ------------------------------------------------------------
// GradeScaleItem.minScore / maxScore are `Decimal(6, 2)`, so the
// smallest representable step between two scores is 0.01. Band
// boundaries are compared as integer hundredths to avoid floating
// point error, and a one-cent boundary is treated as contiguous:
// the seeded scales use 79.99 → 80.00 style bounds, and no
// representable score falls between them.
const SCORE_PRECISION = 0.01;

function toHundredths(value: number): number {
  return Math.round(value / SCORE_PRECISION);
}

// ------------------------------------------------------------
// Band validation
// ------------------------------------------------------------
// Returns the bands in display order (highest band first) with
// `order` derived from that position, or throws ValidationError
// listing every problem found so the caller can show them all at once.

interface NormalizedBand {
  minScore: number;
  maxScore: number;
  symbol: string;
  description: string | null;
  points: number | null;
  isPass: boolean;
}

/** A validated band with its display order resolved. */
type OrderedBand = NormalizedBand & { order: number };

function normalizeBands(
  input: GradeBandInput[],
  options: { protectedSymbols?: string[] } = {},
): OrderedBand[] {
  const issues: Array<{ path: string; message: string }> = [];

  if (!Array.isArray(input) || input.length < 2) {
    throw new ValidationError(
      "A grade scale needs at least 2 grade bands.",
    );
  }

  if (input.length > 20) {
    throw new ValidationError(
      "A grade scale can have at most 20 grade bands.",
    );
  }

  const normalized: NormalizedBand[] = [];

  input.forEach((band, index) => {
    const path = `bands[${index}]`;
    const symbol = typeof band.symbol === "string" ? band.symbol.trim() : "";

    if (symbol.length === 0) {
      issues.push({ path: `${path}.symbol`, message: "Grade symbol is required." });
    } else if (symbol.length > 8) {
      issues.push({
        path: `${path}.symbol`,
        message: `Grade symbol "${symbol}" must be 8 characters or fewer.`,
      });
    }

    const minScore = Number(band.minScore);
    const maxScore = Number(band.maxScore);

    if (!Number.isFinite(minScore)) {
      issues.push({ path: `${path}.minScore`, message: "Minimum score must be a number." });
    }
    if (!Number.isFinite(maxScore)) {
      issues.push({ path: `${path}.maxScore`, message: "Maximum score must be a number." });
    }

    if (Number.isFinite(minScore) && Number.isFinite(maxScore)) {
      if (minScore < 0 || minScore > 100) {
        issues.push({
          path: `${path}.minScore`,
          message: `Minimum score must be between 0 and 100 (got ${minScore}).`,
        });
      }
      if (maxScore < 0 || maxScore > 100) {
        issues.push({
          path: `${path}.maxScore`,
          message: `Maximum score must be between 0 and 100 (got ${maxScore}).`,
        });
      }
      if (minScore > maxScore) {
        issues.push({
          path,
          message: `Band "${symbol || index}" has a minimum (${minScore}) above its maximum (${maxScore}).`,
        });
      }
    }

    if (band.points !== null && band.points !== undefined) {
      const points = Number(band.points);
      if (!Number.isFinite(points) || points < 0) {
        issues.push({
          path: `${path}.points`,
          message: "Grade points must be zero or a positive number.",
        });
      }
    }

    if (symbol) {
      normalized.push({
        minScore,
        maxScore,
        symbol,
        description: band.description?.trim() || null,
        points:
          band.points === null || band.points === undefined
            ? null
            : Number(band.points),
        isPass: band.isPass ?? true,
      });
    }
  });

  // Duplicate symbols
  const seen = new Map<string, number>();
  for (const band of normalized) {
    seen.set(band.symbol, (seen.get(band.symbol) ?? 0) + 1);
  }
  for (const [symbol, count] of seen) {
    if (count > 1) {
      issues.push({
        path: "bands",
        message: `Grade symbol "${symbol}" is used by ${count} bands. Each symbol must be unique within a scale.`,
      });
    }
  }

  // Bands must not be modified once report cards depend on them.
  if (options.protectedSymbols && options.protectedSymbols.length > 0) {
    const nextSymbols = new Set(normalized.map((b) => b.symbol));
    const removed = options.protectedSymbols.filter((s) => !nextSymbols.has(s));
    if (removed.length > 0) {
      issues.push({
        path: "bands",
        message:
          `Grade symbol(s) ${removed.map((s) => `"${s}"`).join(", ")} appear on ` +
          `existing report cards and cannot be removed. Change their score range instead.`,
      });
    }
  }

  if (issues.length > 0) {
    throw new ValidationError(
      `${issues.length} grade band problem(s) must be fixed.`,
      issues,
    );
  }

  // Highest band first — this is both the display order and the order
  // used when matching a score to a band.
  const sorted = [...normalized].sort((a, b) => {
    const byMin = toHundredths(b.minScore) - toHundredths(a.minScore);
    return byMin !== 0 ? byMin : a.symbol.localeCompare(b.symbol);
  });

  // Overlap and gap checks, walking from the highest band downwards.
  sorted.forEach((band, index) => {
    if (index === 0) return;
    const higher = sorted[index - 1];
    const higherMin = toHundredths(higher.minScore);
    const bandMax = toHundredths(band.maxScore);

    if (bandMax >= higherMin) {
      issues.push({
        path: `bands`,
        message:
          `Bands "${higher.symbol}" (${higher.minScore}–${higher.maxScore}) and ` +
          `"${band.symbol}" (${band.minScore}–${band.maxScore}) overlap. ` +
          `Adjust the boundaries so each score maps to exactly one grade.`,
      });
      return;
    }

    const gap = higherMin - bandMax;
    if (gap > 1) {
      issues.push({
        path: `bands`,
        message:
          `Gap between "${band.symbol}" (up to ${band.maxScore}) and ` +
          `"${higher.symbol}" (from ${higher.minScore}): scores ` +
          `${(bandMax + 1) * SCORE_PRECISION}–${(higherMin - 1) * SCORE_PRECISION} ` +
          `have no grade. Extend one of the bands to cover the full 0–100 range.`,
      });
    }
  });

  // Full coverage of the 0–100 percentage range. Both sides are compared
  // in hundredths, since toHundredths() scales 100% to 10000.
  const lowest = sorted[sorted.length - 1];
  const highest = sorted[0];
  if (toHundredths(lowest.minScore) > toHundredths(0)) {
    issues.push({
      path: "bands",
      message:
        `The lowest band "${lowest.symbol}" starts at ${lowest.minScore}. ` +
        `Scores below that have no grade; extend it down to 0.`,
    });
  }
  if (toHundredths(highest.maxScore) < toHundredths(100)) {
    issues.push({
      path: "bands",
      message:
        `The highest band "${highest.symbol}" ends at ${highest.maxScore}. ` +
        `Scores above that have no grade; extend it up to 100.`,
    });
  }

  if (issues.length > 0) {
    throw new ValidationError(
      `${issues.length} grade band problem(s) must be fixed.`,
      issues,
    );
  }

  return sorted.map((band, index) => ({ ...band, order: index + 1 }));
}

// ------------------------------------------------------------
// Scale usage
// ------------------------------------------------------------
// A report card stores the resolved grade symbol, not a scale id, so
// the only link between a scale and the cards it produced is the
// `gradeScaleId` recorded in the REPORT_CARD_GENERATED audit entry.

interface ScaleUsage {
  /** Report card ids per scale id. */
  cardIdsByScale: Map<string, Set<string>>;
  /** Distinct grade symbols per scale id. */
  symbolsByScale: Map<string, Set<string>>;
  /** Report card count per scale id. */
  cardCountByScale: Map<string, number>;
}

async function collectScaleUsage(): Promise<ScaleUsage> {
  const logs = await prisma.auditLog.findMany({
    where: { action: "REPORT_CARD_GENERATED" },
    select: { entityId: true, newValue: true },
  });

  const cardIdsByScale = new Map<string, Set<string>>();
  const allCardIds = new Set<string>();

  for (const log of logs) {
    const value = log.newValue as { gradeScaleId?: string } | null;
    const scaleId = value?.gradeScaleId;
    if (!scaleId || !log.entityId) continue;

    let ids = cardIdsByScale.get(scaleId);
    if (!ids) {
      ids = new Set<string>();
      cardIdsByScale.set(scaleId, ids);
    }
    ids.add(log.entityId);
    allCardIds.add(log.entityId);
  }

  const symbolsByScale = new Map<string, Set<string>>();
  const cardCountByScale = new Map<string, number>();

  if (allCardIds.size > 0) {
    const cardToScale = new Map<string, string>();
    for (const [scaleId, ids] of cardIdsByScale) {
      for (const id of ids) cardToScale.set(id, scaleId);
    }

    const items = await prisma.reportCardItem.findMany({
      where: { reportCardId: { in: [...allCardIds] } },
      select: { reportCardId: true, grade: true },
    });

    for (const item of items) {
      const scaleId = cardToScale.get(item.reportCardId);
      if (!scaleId || !item.grade) continue;

      let symbols = symbolsByScale.get(scaleId);
      if (!symbols) {
        symbols = new Set<string>();
        symbolsByScale.set(scaleId, symbols);
      }
      symbols.add(item.grade);
    }
  }

  for (const [scaleId, ids] of cardIdsByScale) {
    cardCountByScale.set(scaleId, ids.size);
  }

  return { cardIdsByScale, symbolsByScale, cardCountByScale };
}

async function getScaleUsage(scaleId: string) {
  const usage = await collectScaleUsage();
  return {
    reportCardCount: usage.cardCountByScale.get(scaleId) ?? 0,
    usedSymbols: [...(usage.symbolsByScale.get(scaleId) ?? [])].sort(),
  };
}

// ------------------------------------------------------------
// Ambiguity guard
// ------------------------------------------------------------
// `resolveActiveGradeScale` requires exactly one active scale per
// education area, so a configuration that would break that invariant
// is rejected here rather than failing later at report-card time.

async function assertNoActiveConflict(
  area: EducationArea,
  options: { excludeScaleId?: string },
): Promise<void> {
  const existing = await prisma.gradeScale.findFirst({
    where: {
      educationArea: area,
      isActive: true,
      ...(options.excludeScaleId ? { id: { not: options.excludeScaleId } } : {}),
    },
    select: { id: true, name: true },
  });

  if (existing) {
    throw new ConflictError(
      `Another active scale ("${existing.name}") already covers ${area} ` +
        `education. Archive it first, or create this scale as inactive.`,
    );
  }
}

async function assertNotLastActiveScale(scale: {
  id: string;
  name: string;
  educationArea: EducationArea;
}): Promise<void> {
  const activeCount = await prisma.gradeScale.count({
    where: { educationArea: scale.educationArea, isActive: true },
  });

  if (activeCount <= 1) {
    throw new ConflictError(
      `Cannot archive "${scale.name}": it is the only active scale for ` +
        `${scale.educationArea} education. Create or activate a replacement first.`,
    );
  }
}

// ------------------------------------------------------------
// listGradeScales
// ------------------------------------------------------------

export async function listGradeScales(
  actor: CurrentUser,
  options: { includeInactive?: boolean } = {},
): Promise<GradeScaleListItem[]> {
  const allowed = await canForUser(actor, "grade_scales.read");
  if (!allowed) throw new ForbiddenError("grade_scales.read");

  const { includeInactive = true } = options;

  const scales = await prisma.gradeScale.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: {
      items: { select: { id: true } },
    },
    orderBy: [{ educationArea: "asc" }, { isActive: "desc" }, { name: "asc" }],
  });

  if (scales.length === 0) return [];

  const usage = await collectScaleUsage();

  return scales.map((scale) => ({
    id: scale.id,
    name: scale.name,
    educationArea: scale.educationArea,
    description: scale.description,
    isActive: scale.isActive,
    bandCount: scale.items.length,
    reportCardCount: usage.cardCountByScale.get(scale.id) ?? 0,
    createdAt: scale.createdAt,
    updatedAt: scale.updatedAt,
  }));
}

// ------------------------------------------------------------
// getGradeScale
// ------------------------------------------------------------

export async function getGradeScale(
  actor: CurrentUser,
  scaleId: string,
): Promise<GradeScaleDetail> {
  const allowed = await canForUser(actor, "grade_scales.read");
  if (!allowed) throw new ForbiddenError("grade_scales.read");

  const scale = await prisma.gradeScale.findUnique({
    where: { id: scaleId },
    include: {
      items: { orderBy: { order: "asc" } },
    },
  });

  if (!scale) {
    throw new NotFoundError("GradeScale", scaleId);
  }

  const usage = await getScaleUsage(scale.id);

  return {
    id: scale.id,
    name: scale.name,
    educationArea: scale.educationArea,
    description: scale.description,
    isActive: scale.isActive,
    reportCardCount: usage.reportCardCount,
    usedSymbols: usage.usedSymbols,
    bands: scale.items.map((item) => ({
      minScore: item.minScore.toString(),
      maxScore: item.maxScore.toString(),
      symbol: item.symbol,
      description: item.description,
      points: item.points?.toString() ?? null,
      isPass: item.isPass,
      order: item.order,
    })),
  };
}

// ------------------------------------------------------------
// createGradeScale
// ------------------------------------------------------------

export async function createGradeScale(
  actor: CurrentUser,
  input: CreateGradeScaleInput,
) {
  const allowed = await canForUser(actor, "grade_scales.create");
  if (!allowed) throw new ForbiddenError("grade_scales.create");

  const name = input.name?.trim();
  if (!name || name.length < 2) {
    throw new ValidationError("Scale name must be at least 2 characters.");
  }

  if (input.educationArea !== "GENERAL" && input.educationArea !== "TVET") {
    throw new ValidationError("Education area must be GENERAL or TVET.");
  }

  const bands = normalizeBands(input.bands ?? []);
  const isActive = input.isActive ?? true;

  if (isActive) {
    await assertNoActiveConflict(input.educationArea, {});
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.gradeScale.create({
      data: {
        name,
        educationArea: input.educationArea,
        description: input.description?.trim() || null,
        isActive,
        items: {
          create: bands.map((band) => ({
            minScore: band.minScore,
            maxScore: band.maxScore,
            symbol: band.symbol,
            description: band.description,
            points: band.points,
            isPass: band.isPass,
            order: band.order,
          })),
        },
      },
      include: { items: { orderBy: { order: "asc" } } },
    });

    await logAudit({
      actorId: actor.id,
      action: "GRADE_SCALE_CREATED",
      entity: "GradeScale",
      entityId: created.id,
      description: `Created grade scale "${name}" for ${input.educationArea}`,
      newValue: {
        name,
        educationArea: input.educationArea,
        isActive,
        bands: bands.map((b) => ({
          symbol: b.symbol,
          minScore: b.minScore,
          maxScore: b.maxScore,
          points: b.points,
          isPass: b.isPass,
        })),
      },
      tx,
    });

    return created;
  });
}

// ------------------------------------------------------------
// updateGradeScale
// ------------------------------------------------------------
// Replaces the scale's metadata and, when bands are supplied, its
// whole band set. Everything happens in one transaction so a rejected
// change cannot leave the scale half-updated.

export async function updateGradeScale(
  actor: CurrentUser,
  scaleId: string,
  input: UpdateGradeScaleInput,
) {
  const allowed = await canForUser(actor, "grade_scales.update");
  if (!allowed) throw new ForbiddenError("grade_scales.update");

  const scale = await prisma.gradeScale.findUnique({
    where: { id: scaleId },
    select: {
      id: true,
      name: true,
      educationArea: true,
      description: true,
      isActive: true,
      items: true,
    },
  });

  if (!scale) {
    throw new NotFoundError("GradeScale", scaleId);
  }

  const name =
    input.name === undefined ? scale.name : input.name.trim();
  if (!name || name.length < 2) {
    throw new ValidationError("Scale name must be at least 2 characters.");
  }

  const nextIsActive = input.isActive ?? scale.isActive;

  // Validated before any write, using the symbols already on report cards.
  const usage = await getScaleUsage(scale.id);
  const bands =
    input.bands === undefined
      ? null
      : normalizeBands(input.bands, { protectedSymbols: usage.usedSymbols });

  if (nextIsActive) {
    await assertNoActiveConflict(scale.educationArea, {
      excludeScaleId: scale.id,
    });
  }

  // Archiving through the update path must respect the last-active rule.
  if (scale.isActive && !nextIsActive) {
    await assertNotLastActiveScale(scale);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.gradeScale.update({
      where: { id: scale.id },
      data: {
        name,
        description:
          input.description === undefined
            ? scale.description
            : input.description?.trim() || null,
        isActive: nextIsActive,
      },
      include: { items: { orderBy: { order: "asc" } } },
    });

    if (bands) {
      await tx.gradeScaleItem.deleteMany({ where: { gradeScaleId: scale.id } });
      await tx.gradeScaleItem.createMany({
        data: bands.map((band) => ({
          gradeScaleId: scale.id,
          minScore: band.minScore,
          maxScore: band.maxScore,
          symbol: band.symbol,
          description: band.description,
          points: band.points,
          isPass: band.isPass,
          order: band.order,
        })),
      });
    }

    await logAudit({
      actorId: actor.id,
      action: "GRADE_SCALE_UPDATED",
      entity: "GradeScale",
      entityId: scale.id,
      description: `Updated grade scale "${name}"`,
      previousValue: {
        name: scale.name,
        description: scale.description,
        isActive: scale.isActive,
        bands: scale.items.map((item) => ({
          symbol: item.symbol,
          minScore: item.minScore.toString(),
          maxScore: item.maxScore.toString(),
          points: item.points?.toString() ?? null,
          isPass: item.isPass,
          order: item.order,
        })),
      },
      newValue: {
        name,
        description: updated.description,
        isActive: nextIsActive,
        ...(bands
          ? {
              bands: bands.map((b) => ({
                symbol: b.symbol,
                minScore: b.minScore,
                maxScore: b.maxScore,
                points: b.points,
                isPass: b.isPass,
                order: b.order,
              })),
            }
          : {}),
      },
      tx,
    });

    // Read back through the transaction client: the global client runs on a
    // separate connection and would not see this transaction's writes.
    return tx.gradeScale.findUniqueOrThrow({
      where: { id: scale.id },
      include: { items: { orderBy: { order: "asc" } } },
    });
  });
}

// ------------------------------------------------------------
// archiveGradeScale
// ------------------------------------------------------------

export async function archiveGradeScale(
  actor: CurrentUser,
  scaleId: string,
) {
  const allowed = await canForUser(actor, "grade_scales.archive");
  if (!allowed) throw new ForbiddenError("grade_scales.archive");

  const scale = await prisma.gradeScale.findUnique({
    where: { id: scaleId },
    select: { id: true, name: true, educationArea: true, isActive: true },
  });

  if (!scale) {
    throw new NotFoundError("GradeScale", scaleId);
  }

  if (!scale.isActive) {
    throw new ConflictError(`"${scale.name}" is already archived.`);
  }

  await assertNotLastActiveScale(scale);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.gradeScale.update({
      where: { id: scale.id },
      data: { isActive: false },
      include: { items: { orderBy: { order: "asc" } } },
    });

    await logAudit({
      actorId: actor.id,
      action: "GRADE_SCALE_ARCHIVED",
      entity: "GradeScale",
      entityId: scale.id,
      description: `Archived grade scale "${scale.name}"`,
      previousValue: { isActive: true, educationArea: scale.educationArea },
      newValue: { isActive: false },
      tx,
    });

    return updated;
  });
}

// ------------------------------------------------------------
// activateGradeScale
// ------------------------------------------------------------
// The supported way to change which scale an education area uses.
// Deactivating the incumbent and activating the replacement happen in
// one transaction, so the area is never left with zero active scales
// and never holds two of them. Archiving alone cannot achieve this:
// `archiveGradeScale` refuses to archive the last active scale, which
// would otherwise make swapping impossible.

export async function activateGradeScale(
  actor: CurrentUser,
  scaleId: string,
) {
  const allowed = await canForUser(actor, "grade_scales.update");
  if (!allowed) throw new ForbiddenError("grade_scales.update");

  const scale = await prisma.gradeScale.findUnique({
    where: { id: scaleId },
    select: { id: true, name: true, educationArea: true, isActive: true },
  });

  if (!scale) {
    throw new NotFoundError("GradeScale", scaleId);
  }

  if (scale.isActive) {
    throw new ConflictError(`"${scale.name}" is already the active scale.`);
  }

  return prisma.$transaction(async (tx) => {
    const superseded = await tx.gradeScale.findMany({
      where: {
        educationArea: scale.educationArea,
        isActive: true,
        id: { not: scale.id },
      },
      select: { id: true, name: true },
    });

    if (superseded.length > 0) {
      await tx.gradeScale.updateMany({
        where: { id: { in: superseded.map((s) => s.id) } },
        data: { isActive: false },
      });
    }

    const updated = await tx.gradeScale.update({
      where: { id: scale.id },
      data: { isActive: true },
      include: { items: { orderBy: { order: "asc" } } },
    });

    await logAudit({
      actorId: actor.id,
      action: "GRADE_SCALE_UPDATED",
      entity: "GradeScale",
      entityId: scale.id,
      description:
        `Activated grade scale "${scale.name}" for ${scale.educationArea}` +
        (superseded.length > 0
          ? `, replacing ${superseded.map((s) => `"${s.name}"`).join(", ")}`
          : ""),
      previousValue: {
        isActive: false,
        supersededScaleIds: superseded.map((s) => s.id),
      },
      newValue: { isActive: true },
      tx,
    });

    return updated;
  });
}

// ------------------------------------------------------------
// Validation helper exposed for the UI
// ------------------------------------------------------------
// Lets the form preview band problems without a write attempt.

export function previewBandProblems(bands: GradeBandInput[]) {
  try {
    normalizeBands(bands);
    return [] as Array<{ path: string; message: string }>;
  } catch (error) {
    if (error instanceof ValidationError) {
      return error.issues ?? [{ path: "bands", message: error.message }];
    }
    throw error;
  }
}
