import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const results = await prisma.assessmentResult.findMany({
  include: { student: { select: { firstName: true, lastName: true } } },
});

console.log("\n=== Assessment results ===");
for (const r of results) {
  console.log(
    `  ${r.student.firstName} ${r.student.lastName} | score: ${r.score ?? "-"} | absent: ${r.isAbsent}`,
  );
}

const logs = await prisma.auditLog.findMany({
  where: { entity: "Assessment" },
  orderBy: { createdAt: "desc" },
  take: 5,
});

console.log("\n=== Recent audit entries ===");
for (const l of logs) {
  console.log(`  ${l.action} | ${l.description ?? "-"}`);
}

await prisma.$disconnect();