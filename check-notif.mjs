// ============================================================
// check-notif.mjs
// ------------------------------------------------------------
// Quick diagnostic for the notifications table.
// Shows all ABSENCE notifications with their cancel state so you
// can verify the attendance → parent notification flow.
//
// Usage:  node check-notif.mjs
// ============================================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const rows = await prisma.notification.findMany({
  orderBy: { createdAt: "desc" },
  take: 30,
  include: {
    user: { select: { email: true } },
  },
});

if (rows.length === 0) {
  console.log("\n=== No notifications in DB ===\n");
  await prisma.$disconnect();
  process.exit(0);
}

console.log(`\n=== Last ${rows.length} notifications ===\n`);

console.table(
  rows.map((r) => {
    const meta = (r.metadata ?? {});
    return {
      user: r.user?.email ?? "?",
      title: r.title.length > 42 ? r.title.slice(0, 39) + "..." : r.title,
      status: r.status,
      read: r.readAt ? "yes" : "no",
      type: meta.type ?? "-",
      cancelled: meta.cancelledAt ? "YES" : "-",
      createdAt: r.createdAt.toISOString().slice(0, 16).replace("T", " "),
    };
  }),
);

// Summary of ABSENCE notifications specifically
const absences = rows.filter(
  (r) => (r.metadata ?? {}).type === "ABSENCE",
);
const activeAbsences = absences.filter(
  (r) => !(r.metadata ?? {}).cancelledAt && r.status !== "FAILED",
);
const cancelledAbsences = absences.filter(
  (r) => (r.metadata ?? {}).cancelledAt || r.status === "FAILED",
);

console.log(`\nAbsence notifications: ${absences.length} total`);
console.log(`  Active:    ${activeAbsences.length}`);
console.log(`  Cancelled: ${cancelledAbsences.length}\n`);

await prisma.$disconnect();