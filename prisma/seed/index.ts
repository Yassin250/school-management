// ============================================================
// Seed Orchestrator
// Run with: npm run db:seed
// Idempotent — safe to run multiple times.
// ============================================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedRbac, getRbacSummary } from "./rbac";
import { seedSchoolInfo } from "./school-info";
import { seedAcademicStructure } from "./academic-structure";
import { seedCurriculum } from "./curriculum";
import { seedTvet } from "./tvet";
import { seedGradeScales } from "./grade-scales";
import { seedFirstAdmin } from "./first-admin";
import { seedDevUsers } from "./dev-users";

// ------------------------------------------------------------
// Prisma client with adapter (required for Prisma 7)
// ------------------------------------------------------------

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Check your .env file.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const start = Date.now();
  console.log("\n🌱 Starting database seed...\n");

  try {
    // 1. RBAC — roles, permissions, role-permission links
    await seedRbac(prisma);

    // 2. School info — singleton row
    await seedSchoolInfo(prisma);

    // 3. Academic structure — education levels, pathways
    await seedAcademicStructure(prisma);

    // 4. Curriculum — subjects, subject-level links
    await seedCurriculum(prisma);

    // 5. TVET — trades and modules
    await seedTvet(prisma);

    // 6. Grade scales — Primary, Secondary, TVET
    await seedGradeScales(prisma);

    // 7. First admin user — only if no users exist
    await seedFirstAdmin(prisma);


        // 8. Development accounts (dev/test only — never runs in production)
    if (process.env.NODE_ENV !== "production") {
      await seedDevUsers(prisma);
    }


    // Summary
    const rbacSummary = getRbacSummary();
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    console.log("\n📊 Seed summary");
    console.log("─────────────────────────────────────────");
    console.log(`  Roles:                 ${rbacSummary.roleCount}`);
    console.log(`  Permissions:           ${rbacSummary.permissionCount}`);
    console.log(`  Role-permission links: ${rbacSummary.totalRolePermissionLinks}`);
    console.log("─────────────────────────────────────────");
    console.log(`  Completed in ${elapsed}s\n`);
    console.log("✅ Seed complete.\n");
  } catch (error) {
    console.error("\n❌ Seed failed:\n", error);
    process.exit(1);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });