// ============================================================
// Prisma Client Singleton
// Prisma 7 requires an adapter. We use @prisma/adapter-pg.
// In test mode (VITEST=true), uses TEST_DATABASE_URL.
// ============================================================

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ------------------------------------------------------------
// Global singleton (survives Next.js hot reloads in dev)
// ------------------------------------------------------------

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ------------------------------------------------------------
// Choose the connection string:
//   - Tests (VITEST=true) → TEST_DATABASE_URL
//   - Everything else    → DATABASE_URL
// ------------------------------------------------------------

const isTest =
  process.env.VITEST === "true" || process.env.NODE_ENV === "test";

const connectionString = isTest
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    isTest
      ? "TEST_DATABASE_URL is not set. Check your .env file."
      : "DATABASE_URL is not set. Check your .env file and prisma.config.ts.",
  );
}

// ------------------------------------------------------------
// Create or reuse the client
// ------------------------------------------------------------

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}