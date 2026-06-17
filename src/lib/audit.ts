import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "SOFT_DELETE"
  | "RESTORE";

export async function logAudit(params: {
  userId: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  description: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        description: params.description,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
