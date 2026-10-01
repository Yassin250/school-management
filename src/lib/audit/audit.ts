// ============================================================
// Audit Log Writer
// ============================================================
// Every sensitive mutation records an audit entry.
// Call logAudit() inside the same transaction as the mutation
// so that audit and data change succeed or fail together.
// ============================================================

import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export type AuditAction =
  // Auth
  | "LOGIN"
  | "LOGOUT"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET"
  // Users / roles
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_ARCHIVED"
  | "USER_ROLE_ASSIGNED"
  | "USER_ROLE_REVOKED"
  | "ROLE_CREATED"
  | "ROLE_UPDATED"
  | "ROLE_DELETED"
  | "PERMISSION_ASSIGNED"
  | "PERMISSION_REVOKED"
  // Students
  | "STUDENT_CREATED"
  | "STUDENT_UPDATED"
  | "STUDENT_ARCHIVED"
  | "STUDENT_RESTORED"
  // Parents
  | "PARENT_CREATED"
  | "PARENT_UPDATED"
  | "PARENT_ARCHIVED"
  | "PARENT_RESTORED"
  | "PARENT_STUDENT_LINKED"
  | "PARENT_STUDENT_UNLINKED"
  // Teachers
  | "TEACHER_CREATED"
  | "TEACHER_UPDATED"
  | "TEACHER_ARCHIVED"
  | "TEACHER_RESTORED"
  // Enrollment
  | "ENROLLMENT_CREATED"
  | "ENROLLMENT_UPDATED"
  | "ENROLLMENT_TRANSFERRED"
  | "ENROLLMENT_WITHDRAWN"
  | "ENROLLMENT_COMPLETED"
  // Attendance
  | "ATTENDANCE_MARKED"
  | "ATTENDANCE_UPDATED"
  | "ATTENDANCE_CORRECTED"
  // Assessments and grades
  | "ASSESSMENT_CREATED"
  | "ASSESSMENT_UPDATED"
  | "ASSESSMENT_SUBMITTED"
  | "ASSESSMENT_REVIEW_STARTED"
  | "ASSESSMENT_RETURNED"
  | "ASSESSMENT_APPROVED"
  | "ASSESSMENT_LOCKED"
  | "GRADE_ENTERED"
  | "GRADE_UPDATED"
  | "GRADE_CORRECTION_REQUESTED"
  | "GRADE_CORRECTION_AUTHORIZED"
  | "GRADE_CORRECTION_REJECTED"
  // Report cards
  | "REPORT_CARD_GENERATED"
  | "REPORT_CARD_APPROVED"
  | "REPORT_CARD_PUBLISHED"
  | "REPORT_CARD_REGENERATED"
  // Finance
  | "FEE_STRUCTURE_CREATED"
  | "FEE_STRUCTURE_UPDATED"
  | "INVOICE_CREATED"
  | "INVOICE_UPDATED"
  | "INVOICE_CANCELLED"
  | "PAYMENT_CREATED"
  | "PAYMENT_UPDATED"
  | "PAYMENT_REFUNDED"
  | "RECEIPT_ISSUED"
  | "RECEIPT_CANCELLED"
  | "DISCOUNT_CREATED"
  | "DISCOUNT_APPROVED"
  | "DISCOUNT_CANCELLED"
  | "SCHOLARSHIP_CREATED"
  | "SCHOLARSHIP_UPDATED"
  | "SCHOLARSHIP_ARCHIVED"
  // Communication
  | "ANNOUNCEMENT_CREATED"
  | "ANNOUNCEMENT_UPDATED"
  | "ANNOUNCEMENT_PUBLISHED"
  | "ANNOUNCEMENT_ARCHIVED"
  // System
  | "SECURITY_SETTING_CHANGED"
  | "SYSTEM_CONFIG_CHANGED";

export interface LogAuditParams {
  actorId: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  description?: string;
  previousValue?: Prisma.InputJsonValue | null;
  newValue?: Prisma.InputJsonValue | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  /**
   * Optional transaction client. When provided, the audit log is written
   * inside the same transaction as the mutation.
   */
  tx?: Prisma.TransactionClient;
}

// ------------------------------------------------------------
// logAudit
// ------------------------------------------------------------

/**
 * Writes an audit log entry.
 *
 * Usage (inside a transaction):
 *   await prisma.$transaction(async (tx) => {
 *     await tx.assessment.update({ ... });
 *     await logAudit({
 *       actorId: user.id,
 *       action: "ASSESSMENT_APPROVED",
 *       entity: "Assessment",
 *       entityId: assessment.id,
 *       previousValue: { status: "UNDER_REVIEW" },
 *       newValue: { status: "APPROVED" },
 *       tx,
 *     });
 *   });
 *
 * Usage (outside a transaction):
 *   await logAudit({
 *     actorId: user.id,
 *     action: "USER_CREATED",
 *     entity: "User",
 *     entityId: user.id,
 *   });
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  const client: PrismaClient | Prisma.TransactionClient =
    params.tx ?? prisma;

  // Merge metadata into the description if provided
  const description = params.description ?? buildDescription(params);

  await client.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      description: description ?? null,
      previousValue: params.previousValue ?? undefined,
      newValue: params.newValue ?? undefined,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
  });
}

// ------------------------------------------------------------
// Helper - auto-describe the action if no description was provided
// ------------------------------------------------------------

function buildDescription(params: LogAuditParams): string | undefined {
  const { action, entity, entityId } = params;
  if (!entityId) return `${action} ${entity}`;
  return `${action} ${entity} ${entityId}`;
}