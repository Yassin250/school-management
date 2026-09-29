// ============================================================
// Seed — School Info (singleton row)
// ============================================================

import type { PrismaClient } from "@prisma/client";

/**
 * Seeds the singleton SchoolInfo row.
 *
 * Idempotent: uses upsert with the fixed ID "singleton".
 * The school admin can edit these values later from the UI.
 */
export async function seedSchoolInfo(prisma: PrismaClient): Promise<void> {
  console.log("🌱 Seeding school info...");

  await prisma.schoolInfo.upsert({
    where: { id: "singleton" },
    update: {
      // Do NOT overwrite admin-edited values on re-seed.
      // Only set defaults if the row was just created (see `create` below).
    },
    create: {
      id: "singleton",
      name: "School Name",
      shortName: "School",
      motto: null,
      country: "Rwanda",
      city: null,
      address: null,
      phone: null,
      email: null,
      website: null,
      principalName: null,
      establishedAt: null,
    },
  });

  console.log("  ✓ School info ready\n");
}