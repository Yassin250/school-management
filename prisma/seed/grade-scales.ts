// ============================================================
// Seed — Grade Scales
// Three configurable scales: Primary, Secondary, TVET.
// ============================================================

import type { PrismaClient, EducationArea } from "@prisma/client";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

interface ScaleItemSeed {
  minScore: number;
  maxScore: number;
  symbol: string;
  description: string;
  points?: number;
  isPass: boolean;
  order: number;
}

interface ScaleSeed {
  name: string;
  educationArea: EducationArea;
  description: string;
  isActive: boolean;
  items: ScaleItemSeed[];
}

// ------------------------------------------------------------
// Scales
// ------------------------------------------------------------
// Exactly ONE scale per education area may be active. Report-card
// generation resolves the active scale by education area and fails
// safely when the configuration is missing or ambiguous, so the
// Primary and Secondary general-education scales — which carry
// identical bands here — cannot both be active. "Secondary Standard"
// is the active default; "Primary Standard" is kept as an
// inactive alternative the school can activate after archiving the
// other. Switching between them changes no grade.
const SCALES: ScaleSeed[] = [
  // --------------------------------------------------------
  // Primary (P1–P6) — Rwandan primary grading
  // --------------------------------------------------------
  {
    name: "Primary Standard",
    educationArea: "GENERAL",
    description:
      "Standard grading scale for Primary (P1–P6). Configurable by school admin.",
    isActive: false,
    items: [
      { minScore: 80, maxScore: 100, symbol: "A", description: "Excellent", points: 4.0, isPass: true, order: 1 },
      { minScore: 70, maxScore: 79.99, symbol: "B", description: "Very Good", points: 3.0, isPass: true, order: 2 },
      { minScore: 60, maxScore: 69.99, symbol: "C", description: "Good", points: 2.0, isPass: true, order: 3 },
      { minScore: 50, maxScore: 59.99, symbol: "D", description: "Satisfactory", points: 1.0, isPass: true, order: 4 },
      { minScore: 0, maxScore: 49.99, symbol: "F", description: "Fail", points: 0.0, isPass: false, order: 5 },
    ],
  },

  // --------------------------------------------------------
  // Secondary (S1–S6) — the active general-education scale
  // --------------------------------------------------------
  {
    name: "Secondary Standard",
    educationArea: "GENERAL",
    description:
      "Standard grading scale for Secondary (S1–S6). Configurable by school admin.",
    isActive: true,
    items: [
      { minScore: 80, maxScore: 100, symbol: "A", description: "Excellent", points: 4.0, isPass: true, order: 1 },
      { minScore: 70, maxScore: 79.99, symbol: "B", description: "Very Good", points: 3.0, isPass: true, order: 2 },
      { minScore: 60, maxScore: 69.99, symbol: "C", description: "Good", points: 2.0, isPass: true, order: 3 },
      { minScore: 50, maxScore: 59.99, symbol: "D", description: "Satisfactory", points: 1.0, isPass: true, order: 4 },
      { minScore: 0, maxScore: 49.99, symbol: "F", description: "Fail", points: 0.0, isPass: false, order: 5 },
    ],
  },

  // --------------------------------------------------------
  // TVET (L3–L5) — Competency-based
  // --------------------------------------------------------
  {
    name: "TVET Competency",
    educationArea: "TVET",
    description:
      "Competency-based grading for TVET (L3–L5). Marks reflect demonstrated competency.",
    isActive: true,
    items: [
      { minScore: 80, maxScore: 100, symbol: "C", description: "Competent (Distinction)", points: 4.0, isPass: true, order: 1 },
      { minScore: 60, maxScore: 79.99, symbol: "C+", description: "Competent (Proficient)", points: 3.0, isPass: true, order: 2 },
      { minScore: 50, maxScore: 59.99, symbol: "C-", description: "Competent (Satisfactory)", points: 2.0, isPass: true, order: 3 },
      { minScore: 0, maxScore: 49.99, symbol: "NYC", description: "Not Yet Competent", points: 0.0, isPass: false, order: 4 },
    ],
  },
];

// ------------------------------------------------------------
// Seed function
// ------------------------------------------------------------

export async function seedGradeScales(prisma: PrismaClient): Promise<void> {
  console.log("🌱 Seeding grade scales...");

  let scaleCount = 0;
  let itemCount = 0;

  for (const scale of SCALES) {
    // Upsert the scale itself.
    // @@unique([name]) is not defined on GradeScale in the schema, so we
    // must look it up by name manually to remain idempotent.
    const existing = await prisma.gradeScale.findFirst({
      where: { name: scale.name },
    });

    let gradeScaleId: string;

    if (existing) {
      const updated = await prisma.gradeScale.update({
        where: { id: existing.id },
        data: {
          educationArea: scale.educationArea,
          description: scale.description,
          isActive: scale.isActive,
        },
      });
      gradeScaleId = updated.id;
    } else {
      const created = await prisma.gradeScale.create({
        data: {
          name: scale.name,
          educationArea: scale.educationArea,
          description: scale.description,
          isActive: scale.isActive,
        },
      });
      gradeScaleId = created.id;
    }

    scaleCount++;

    // Upsert items for this scale.
    // GradeScaleItem has no compound unique on (scaleId, order) or (scaleId, symbol),
    // so we delete + recreate to stay idempotent.
    await prisma.gradeScaleItem.deleteMany({
      where: { gradeScaleId },
    });

    for (const item of scale.items) {
      await prisma.gradeScaleItem.create({
        data: {
          gradeScaleId,
          minScore: item.minScore,
          maxScore: item.maxScore,
          symbol: item.symbol,
          description: item.description,
          points: item.points ?? null,
          isPass: item.isPass,
          order: item.order,
        },
      });
      itemCount++;
    }
  }

  console.log(`  ✓ Grade scales upserted: ${scaleCount}`);
  console.log(`  ✓ Grade scale items upserted: ${itemCount}`);
  console.log("  ✓ Grade scales ready\n");
}