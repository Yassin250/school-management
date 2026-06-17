import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createExtendedClient> | undefined;
};

const SOFT_DELETE_MODELS = new Set(["Student", "Teacher", "Parent"]);

const READ_OPERATIONS = new Set([
  "findMany",
  "findFirst",
  "findUnique",
  "count",
  "aggregate",
  "groupBy",
]);

function applySoftDeleteFilter(args: any): any {
  return {
    ...args,
    where: {
      ...(args?.where || {}),
      deletedAt: null,
    },
  };
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to your .env file.");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function createExtendedClient() {
  const base = createPrismaClient();

  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          if (SOFT_DELETE_MODELS.has(model) && READ_OPERATIONS.has(operation)) {
            // findUnique requires the where clause to match a @unique constraint
            // exactly — we cannot inject extra fields like deletedAt.
            // Rewrite findUnique → findFirst so the soft-delete filter is valid.
            if (operation === "findUnique" || operation === "findUniqueOrThrow") {
              const filteredArgs = applySoftDeleteFilter(args);
              // Switch to findFirst which accepts arbitrary where conditions
              const ctx = base as any;
              const modelName = model.charAt(0).toLowerCase() + model.slice(1);
              return ctx[modelName].findFirst(filteredArgs);
            }
            return query(applySoftDeleteFilter(args));
          }
          return query(args);
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createExtendedClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** Bypass soft-delete filter for admin recovery / audit queries */
export async function softDeleteRecord(
  model: "student" | "teacher" | "parent",
  id: string
) {
  const deletedAt = new Date();
  switch (model) {
    case "student":
      return prisma.student.update({ where: { id }, data: { deletedAt } });
    case "teacher":
      return prisma.teacher.update({ where: { id }, data: { deletedAt } });
    case "parent":
      return prisma.parent.update({ where: { id }, data: { deletedAt } });
  }
}

export async function restoreSoftDeletedRecord(
  model: "student" | "teacher" | "parent",
  id: string
) {
  switch (model) {
    case "student":
      return prisma.student.update({ where: { id }, data: { deletedAt: null } });
    case "teacher":
      return prisma.teacher.update({ where: { id }, data: { deletedAt: null } });
    case "parent":
      return prisma.parent.update({ where: { id }, data: { deletedAt: null } });
  }
}
