import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// ------------------------------------------------------------
// 1. Check teacher permission
// ------------------------------------------------------------

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const permResult = await client.query(`
  SELECT p.key AS permission
  FROM role_permissions rp
  JOIN roles r ON r.id = rp."roleId"
  JOIN permissions p ON p.id = rp."permissionId"
  WHERE r.key = 'TEACHER'
    AND p.key IN ('assessments.create', 'assessments.read', 'assessments.update')
  ORDER BY p.key
`);

console.log("\n=== Teacher assessment permissions ===");
if (permResult.rows.length === 0) {
  console.log("  NONE FOUND - This is the problem");
} else {
  for (const row of permResult.rows) {
    console.log(`  ✓ ${row.permission}`);
  }
}

// ------------------------------------------------------------
// 2. Check for created assessments
// ------------------------------------------------------------

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const assessments = await prisma.assessment.findMany({
  take: 5,
  orderBy: { createdAt: "desc" },
  include: {
    subject: { select: { name: true } },
    class: { select: { name: true } },
    teacher: { select: { firstName: true, lastName: true } },
  },
});

console.log("\n=== Recent assessments ===");
if (assessments.length === 0) {
  console.log("  NONE - The form didn't submit, or the submission failed");
} else {
  for (const a of assessments) {
    console.log(
      `  ${a.title} | ${a.type} | ${a.subject?.name ?? "-"} | ${a.class.name} | ${a.status} | by ${a.teacher.firstName} ${a.teacher.lastName}`,
    );
  }
}

// ------------------------------------------------------------
// 3. Check audit log
// ------------------------------------------------------------

const auditLogs = await prisma.auditLog.findMany({
  where: { action: "ASSESSMENT_CREATED" },
  orderBy: { createdAt: "desc" },
  take: 5,
});

console.log("\n=== Audit log: ASSESSMENT_CREATED ===");
if (auditLogs.length === 0) {
  console.log("  NONE - Assessment creation was not audited");
} else {
  for (const log of auditLogs) {
    console.log(`  ${log.description} | ${log.createdAt.toISOString()}`);
  }
}

await prisma.$disconnect();
await client.end();