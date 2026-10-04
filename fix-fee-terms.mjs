import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const term = await prisma.term.findFirst({ where: { isCurrent: true } });
if (!term) {
  console.log("No current term found");
  process.exit(0);
}

const updated = await prisma.feeStructure.updateMany({
  where: { termId: null },
  data: { termId: term.id },
});

console.log(`Updated ${updated.count} fee structure(s) with term "${term.name}"`);

await prisma.$disconnect();