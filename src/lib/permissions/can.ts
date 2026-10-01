// ============================================================
// Authorization Service
// ============================================================
// Combines two checks:
//   1. Does the user have the required permission?
//   2. Does the user have access to the specific resource (scope)?
//
// The result is the only source of truth for authorization.
// UI hides buttons for UX. This function enforces security.
// ============================================================

import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import type { Permission } from "@/lib/permissions/constants";
import {
  canAccessStudent,
  canAccessClass,
  canAccessAssessment,
  canAccessReportCard,
  canAccessInvoice,
  canAccessPayment,
  canAccessAttendance,
  canAccessAnnouncement,
} from "@/lib/permissions/scope";

// ============================================================
// Resource context
// ============================================================
// A discriminated union: each variant describes what resource
// the user is trying to act on. When the caller passes a context,
// can() will additionally enforce scope rules.
// ============================================================

export type ResourceContext =
  | { type: "student"; studentId: string }
  | { type: "class"; classId: string }
  | { type: "assessment"; assessmentId: string }
  | { type: "report_card"; reportCardId: string }
  | { type: "invoice"; invoiceId: string }
  | { type: "payment"; paymentId: string }
  | { type: "attendance"; attendanceId: string }
  | { type: "announcement"; announcementId: string };

// ============================================================
// Scope evaluator
// ============================================================

async function checkScope(
  user: CurrentUser,
  context: ResourceContext,
): Promise<boolean> {
  switch (context.type) {
    case "student":
      return canAccessStudent(user, context.studentId);
    case "class":
      return canAccessClass(user, context.classId);
    case "assessment":
      return canAccessAssessment(user, context.assessmentId);
    case "report_card":
      return canAccessReportCard(user, context.reportCardId);
    case "invoice":
      return canAccessInvoice(user, context.invoiceId);
    case "payment":
      return canAccessPayment(user, context.paymentId);
    case "attendance":
      return canAccessAttendance(user, context.attendanceId);
    case "announcement":
      return canAccessAnnouncement(user, context.announcementId);
  }
}

// ============================================================
// can() - the main authorization check
// ============================================================

/**
 * Returns true if the given user is allowed to perform the action.
 *
 * Behavior:
 *   - If the user is null -> false (unauthenticated)
 *   - If the user lacks the permission -> false
 *   - If a resource context is provided, scope is checked -> false if denied
 *   - Otherwise -> true
 *
 * This function is the ONLY place that combines permission + scope.
 * Everything else calls it. Nothing bypasses it.
 */
export async function can(
  permission: Permission,
  context?: ResourceContext,
): Promise<boolean> {
  const user = await getCurrentUser();
  return canForUser(user, permission, context);
}

/**
 * Same as can(), but takes a CurrentUser directly.
 * Useful when the caller has already loaded the user in the same request.
 */
export async function canForUser(
  user: CurrentUser | null,
  permission: Permission,
  context?: ResourceContext,
): Promise<boolean> {
  // 1. Authentication check
  if (!user) return false;

  // 2. Permission check
  if (!user.permissions.has(permission)) return false;

  // 3. Scope check (only if a resource context was provided)
  if (context) {
    const inScope = await checkScope(user, context);
    if (!inScope) return false;
  }

  return true;
}