// ============================================================
// Seed — Academic Structure
// Education levels (P1–P6, S1–S6, L3–L5) and upper-secondary pathways.
// ============================================================

import type { PrismaClient } from "@prisma/client";

// ------------------------------------------------------------
// Education levels
// ------------------------------------------------------------

interface LevelSeed {
  code: string;
  name: string;
  area: "GENERAL" | "TVET";
  order: number;
}

const EDUCATION_LEVELS: LevelSeed[] = [
  // Primary
  { code: "P1", name: "Primary 1", area: "GENERAL", order: 1 },
  { code: "P2", name: "Primary 2", area: "GENERAL", order: 2 },
  { code: "P3", name: "Primary 3", area: "GENERAL", order: 3 },
  { code: "P4", name: "Primary 4", area: "GENERAL", order: 4 },
  { code: "P5", name: "Primary 5", area: "GENERAL", order: 5 },
  { code: "P6", name: "Primary 6", area: "GENERAL", order: 6 },

  // Secondary — Lower
  { code: "S1", name: "Secondary 1", area: "GENERAL", order: 7 },
  { code: "S2", name: "Secondary 2", area: "GENERAL", order: 8 },
  { code: "S3", name: "Secondary 3", area: "GENERAL", order: 9 },

  // Secondary — Upper
  { code: "S4", name: "Secondary 4", area: "GENERAL", order: 10 },
  { code: "S5", name: "Secondary 5", area: "GENERAL", order: 11 },
  { code: "S6", name: "Secondary 6", area: "GENERAL", order: 12 },

  // TVET
  { code: "L3", name: "TVET Level 3", area: "TVET", order: 13 },
  { code: "L4", name: "TVET Level 4", area: "TVET", order: 14 },
  { code: "L5", name: "TVET Level 5", area: "TVET", order: 15 },
];

// ------------------------------------------------------------
// Pathways — only for upper secondary (S4–S6)
// Per MINEDUC 2026 reform:
//   - Mathematics and Sciences
//   - Arts and Humanities
//   - Languages
// ------------------------------------------------------------

interface PathwaySeed {
  levelCode: string;
  code: string;
  name: string;
  description: string;
}

const PATHWAYS: PathwaySeed[] = [
  // S4
  {
    levelCode: "S4",
    code: "MATH_SCI",
    name: "Mathematics and Sciences",
    description: "Focus on mathematics, physics, chemistry, biology, and ICT.",
  },
  {
    levelCode: "S4",
    code: "ARTS_HUM",
    name: "Arts and Humanities",
    description: "Focus on history, geography, literature, and social studies.",
  },
  {
    levelCode: "S4",
    code: "LANG",
    name: "Languages",
    description: "Focus on languages: English, French, Kinyarwanda, Kiswahili.",
  },
  // S5
  {
    levelCode: "S5",
    code: "MATH_SCI",
    name: "Mathematics and Sciences",
    description: "Focus on mathematics, physics, chemistry, biology, and ICT.",
  },
  {
    levelCode: "S5",
    code: "ARTS_HUM",
    name: "Arts and Humanities",
    description: "Focus on history, geography, literature, and social studies.",
  },
  {
    levelCode: "S5",
    code: "LANG",
    name: "Languages",
    description: "Focus on languages: English, French, Kinyarwanda, Kiswahili.",
  },
  // S6
  {
    levelCode: "S6",
    code: "MATH_SCI",
    name: "Mathematics and Sciences",
    description: "Focus on mathematics, physics, chemistry, biology, and ICT.",
  },
  {
    levelCode: "S6",
    code: "ARTS_HUM",
    name: "Arts and Humanities",
    description: "Focus on history, geography, literature, and social studies.",
  },
  {
    levelCode: "S6",
    code: "LANG",
    name: "Languages",
    description: "Focus on languages: English, French, Kinyarwanda, Kiswahili.",
  },
];

// ------------------------------------------------------------
// Seed function
// ------------------------------------------------------------

export async function seedAcademicStructure(
  prisma: PrismaClient,
): Promise<void> {
  console.log("🌱 Seeding academic structure...");

  // 1. Upsert education levels
  let levelCount = 0;
  for (const level of EDUCATION_LEVELS) {
    await prisma.educationLevel.upsert({
      where: { code: level.code },
      update: {
        name: level.name,
        area: level.area,
        order: level.order,
      },
      create: {
        code: level.code,
        name: level.name,
        area: level.area,
        order: level.order,
      },
    });
    levelCount++;
  }
  console.log(`  ✓ Education levels upserted: ${levelCount}`);

  // 2. Load levels into a map for pathway FK lookups
  const levels = await prisma.educationLevel.findMany();
  const levelByCode = new Map(levels.map((l) => [l.code, l]));

  // 3. Upsert pathways
  let pathwayCount = 0;
  for (const p of PATHWAYS) {
    const level = levelByCode.get(p.levelCode);
    if (!level) {
      console.warn(`  ⚠ Level not found for pathway: ${p.levelCode}`);
      continue;
    }

    await prisma.pathway.upsert({
      where: {
        educationLevelId_code: {
          educationLevelId: level.id,
          code: p.code,
        },
      },
      update: {
        name: p.name,
        description: p.description,
      },
      create: {
        educationLevelId: level.id,
        code: p.code,
        name: p.name,
        description: p.description,
      },
    });
    pathwayCount++;
  }
  console.log(`  ✓ Pathways upserted: ${pathwayCount}`);

  console.log("  ✓ Academic structure ready\n");
}