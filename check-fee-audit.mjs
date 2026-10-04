import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const logs = await prisma.auditLog.findMany({
  where: { entity: "FeeStructure" },
  orderBy: { createdAt: "desc" },
  take: 5,
});

console.table(
  logs.map((x) => ({
    action: x.action,
    description: x.description,
    at: x.createdAt.toISOString(),
  })),
);

await prisma.$disconnect();