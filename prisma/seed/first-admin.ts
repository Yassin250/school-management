// ============================================================
// Seed — First Admin User
// Creates the initial System Administrator account if none exists.
// Idempotent: does nothing if any user already exists.
// ============================================================

import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLES } from "../../src/lib/permissions/constants";

// ------------------------------------------------------------
// Defaults
// Override via environment variables in production:
//   SEED_ADMIN_EMAIL
//   SEED_ADMIN_USERNAME
//   SEED_ADMIN_PASSWORD
// ------------------------------------------------------------

const DEFAULT_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@school.rw";
const DEFAULT_USERNAME = process.env.SEED_ADMIN_USERNAME ?? "admin";
const DEFAULT_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

const BCRYPT_COST = 12;

// ------------------------------------------------------------
// Seed function
// ------------------------------------------------------------

export async function seedFirstAdmin(prisma: PrismaClient): Promise<void> {
  console.log("🌱 Seeding first admin...");

  // 1. If any user exists, do nothing — this seed only bootstraps a fresh DB.
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("  ℹ Users already exist — skipping first admin creation\n");
    return;
  }

  // 2. Ensure the SYSTEM_ADMIN role exists
  const systemAdminRole = await prisma.role.findUnique({
    where: { key: ROLES.SYSTEM_ADMIN },
  });

  if (!systemAdminRole) {
    throw new Error(
      `Role "${ROLES.SYSTEM_ADMIN}" not found. Run seedRbac() before seedFirstAdmin().`,
    );
  }

  // 3. Hash the password
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_COST);

  // 4. Create the user and link the SYSTEM_ADMIN role in a transaction
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: DEFAULT_EMAIL,
        username: DEFAULT_USERNAME,
        passwordHash,
        status: "ACTIVE",
        mustChangePassword: true, // force password change on first login
      },
    });

    await tx.userRole.create({
      data: {
        userId: created.id,
        roleId: systemAdminRole.id,
        assignedBy: "system-seed",
      },
    });

    return created;
  });

  console.log(`  ✓ Admin user created: ${user.email}`);
  console.log(`  ✓ Username: ${user.username}`);
  if (DEFAULT_PASSWORD === "ChangeMe123!") {
    console.log(`  ⚠ Temporary password: ${DEFAULT_PASSWORD}`);
    console.log(`    → Change it immediately after first login.`);
  } else {
    console.log(`  ✓ Password: from SEED_ADMIN_PASSWORD env var`);
  }
  console.log("  ✓ First admin ready\n");
}