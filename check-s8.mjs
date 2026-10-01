import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const rcs = await prisma.reportCard.findMany({
  include: {
    student: { select: { firstName: true, lastName: true } },
    items: { include: { subject: { select: { name: true } } } },
  },
  orderBy: { createdAt: "asc" },
});

console.log("\n=== Report Cards ===");
console.table(
  rcs.map((rc) => ({
    student: `${rc.student.firstName} ${rc.student.lastName}`,
    status: rc.status,
    average: rc.averageScore?.toString() ?? "-",
    items: rc.items.length,
    reference: rc.referenceCode,
  })),
);

await prisma.$disconnect();