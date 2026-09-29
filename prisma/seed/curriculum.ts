// ============================================================
// Seed — Curriculum (Subjects and Subject-Level Links)
// General Education only. TVET modules are seeded in tvet.ts.
// ============================================================

import type { PrismaClient } from "@prisma/client";

// ------------------------------------------------------------
// Subjects
// ------------------------------------------------------------

interface SubjectSeed {
  code: string;
  name: string;
  description?: string;
}

const SUBJECTS: SubjectSeed[] = [
  // Languages
  { code: "KIN", name: "Kinyarwanda", description: "Official Rwandan language." },
  { code: "ENG", name: "English" },
  { code: "FRE", name: "French" },
  { code: "KIS", name: "Kiswahili" },

  // Core
  { code: "MATH", name: "Mathematics" },
  { code: "SET", name: "Science and Elementary Technology", description: "Primary-level integrated science." },
  { code: "SCI", name: "Science" },
  { code: "PHY", name: "Physics" },
  { code: "CHE", name: "Chemistry" },
  { code: "BIO", name: "Biology" },

  // Humanities
  { code: "SRS", name: "Social and Religious Studies" },
  { code: "HIS", name: "History" },
  { code: "GEO", name: "Geography" },
  { code: "LIT", name: "Literature" },

  // Applied
  { code: "ICT", name: "Information and Communication Technology" },
  { code: "ENT", name: "Entrepreneurship" },
  { code: "PES", name: "Physical Education and Sports" },
  { code: "CA", name: "Creative Arts" },
];

// ------------------------------------------------------------
// Subject → Level mapping
// For each level, list the subject codes taught.
// isMandatory is true for all in V1.
// ------------------------------------------------------------

interface LevelSubjectsSeed {
  levelCode: string;
  subjectCodes: string[];
}

const LEVEL_SUBJECTS: LevelSubjectsSeed[] = [
  // --------------------------------------------------------
  // Primary (P1–P6) — Rwanda National Curriculum
  // --------------------------------------------------------
  {
    levelCode: "P1",
    subjectCodes: ["KIN", "ENG", "MATH", "SET", "SRS", "PES", "CA"],
  },
  {
    levelCode: "P2",
    subjectCodes: ["KIN", "ENG", "MATH", "SET", "SRS", "PES", "CA"],
  },
  {
    levelCode: "P3",
    subjectCodes: ["KIN", "ENG", "FRE", "MATH", "SET", "SRS", "PES", "CA"],
  },
  {
    levelCode: "P4",
    subjectCodes: ["KIN", "ENG", "FRE", "MATH", "SET", "SRS", "PES", "CA"],
  },
  {
    levelCode: "P5",
    subjectCodes: ["KIN", "ENG", "FRE", "MATH", "SET", "SRS", "PES", "CA"],
  },
  {
    levelCode: "P6",
    subjectCodes: ["KIN", "ENG", "FRE", "MATH", "SET", "SRS", "PES", "CA"],
  },

  // --------------------------------------------------------
  // Lower Secondary (S1–S3) — Common core
  // --------------------------------------------------------
  {
    levelCode: "S1",
    subjectCodes: ["KIN", "ENG", "FRE", "KIS", "MATH", "PHY", "CHE", "BIO", "HIS", "GEO", "ICT", "ENT", "PES"],
  },
  {
    levelCode: "S2",
    subjectCodes: ["KIN", "ENG", "FRE", "KIS", "MATH", "PHY", "CHE", "BIO", "HIS", "GEO", "ICT", "ENT", "PES"],
  },
  {
    levelCode: "S3",
    subjectCodes: ["KIN", "ENG", "FRE", "KIS", "MATH", "PHY", "CHE", "BIO", "HIS", "GEO", "ICT", "ENT", "PES"],
  },

  // --------------------------------------------------------
  // Upper Secondary (S4–S6) — Common core subjects across pathways.
  // Pathway-specific subjects are added via Class-level configuration
  // in a future release. In V1, we seed a broad common set.
  // --------------------------------------------------------
  {
    levelCode: "S4",
    subjectCodes: ["KIN", "ENG", "FRE", "KIS", "MATH", "PHY", "CHE", "BIO", "HIS", "GEO", "LIT", "ICT", "ENT", "PES"],
  },
  {
    levelCode: "S5",
    subjectCodes: ["KIN", "ENG", "FRE", "KIS", "MATH", "PHY", "CHE", "BIO", "HIS", "GEO", "LIT", "ICT", "ENT", "PES"],
  },
  {
    levelCode: "S6",
    subjectCodes: ["KIN", "ENG", "FRE", "KIS", "MATH", "PHY", "CHE", "BIO", "HIS", "GEO", "LIT", "ICT", "ENT", "PES"],
  },
];

// ------------------------------------------------------------
// Seed function
// ------------------------------------------------------------

export async function seedCurriculum(prisma: PrismaClient): Promise<void> {
  console.log("🌱 Seeding curriculum...");

  // 1. Upsert subjects
  let subjectCount = 0;
  for (const subject of SUBJECTS) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: {
        name: subject.name,
        description: subject.description ?? null,
      },
      create: {
        code: subject.code,
        name: subject.name,
        description: subject.description ?? null,
      },
    });
    subjectCount++;
  }
  console.log(`  ✓ Subjects upserted: ${subjectCount}`);

  // 2. Load subjects and levels into maps
  const subjects = await prisma.subject.findMany();
  const levels = await prisma.educationLevel.findMany();

  const subjectByCode = new Map(subjects.map((s) => [s.code, s]));
  const levelByCode = new Map(levels.map((l) => [l.code, l]));

  // 3. Upsert subject-level links
  let linkCount = 0;
  const skipped: string[] = [];

  for (const entry of LEVEL_SUBJECTS) {
    const level = levelByCode.get(entry.levelCode);
    if (!level) {
      console.warn(`  ⚠ Level not found: ${entry.levelCode}`);
      continue;
    }

    for (const subjectCode of entry.subjectCodes) {
      const subject = subjectByCode.get(subjectCode);
      if (!subject) {
        skipped.push(`${entry.levelCode}/${subjectCode}`);
        continue;
      }

      await prisma.subjectLevel.upsert({
        where: {
          subjectId_educationLevelId: {
            subjectId: subject.id,
            educationLevelId: level.id,
          },
        },
        update: {
          isMandatory: true,
        },
        create: {
          subjectId: subject.id,
          educationLevelId: level.id,
          isMandatory: true,
        },
      });
      linkCount++;
    }
  }

  console.log(`  ✓ Subject-level links upserted: ${linkCount}`);
  if (skipped.length > 0) {
    console.warn(`  ⚠ Skipped (subject not found): ${skipped.join(", ")}`);
  }

  console.log("  ✓ Curriculum ready\n");
}