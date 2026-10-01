import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ------------------------------------------------------------
// 1. Assessments
// ------------------------------------------------------------

const assessments = await prisma.assessment.findMany({
  select: {
    title: true,
    status: true,
    submittedAt: true,
    reviewedAt: true,
    approvedAt: true,
  },
});

console.log("\n=== Assessments ===");
console.table(assessments);

// ------------------------------------------------------------
// 2. Audit trail
// ------------------------------------------------------------

const logs = await prisma.auditLog.findMany({
  where: { entity: "Assessment" },
  orderBy: { createdAt: "asc" },
});

console.log("\n=== Full audit trail ===");
for (const l of logs) {
  console.log(`  ${l.createdAt.toISOString()} | ${l.action}`);
}

await prisma.$disconnect();