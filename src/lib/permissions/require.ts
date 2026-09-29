// ============================================================
// requirePermission — Throw-on-Deny Authorization
// ============================================================
// Server actions and API routes call requirePermission() instead of
// can(). If the check fails, it throws a typed error that the error
// handler converts into a 401 or 403 response.
//
// On success, it returns the loaded CurrentUser so callers don't have
// to load it again.
// ============================================================

import {
  getCurrentUser,
  type CurrentUser,
} from "@/lib/auth/session";
import {
  canForUser,
  type ResourceContext,
} from "@/lib/permissions/can";
import type { Permission } from "@/lib/permissions/constants";
import {
  UnauthenticatedError,
  ForbiddenError,
} from "@/lib/errors";

// ------------------------------------------------------------
// requirePermission
// ------------------------------------------------------------

/**
 * Ensures the current user has the given permission and (optionally)
 * access to the given resource.
 *
 * Throws:
 *   - UnauthenticatedError (401) if no valid session
 *   - ForbiddenError (403) if the user lacks the permission
 *   - ForbiddenError (403) if the user lacks scope access
 *
 * Returns the loaded CurrentUser on success.
 *
 * Usage:
 *   const user = await requirePermission("students.update", {
 *     type: "student",
 *     studentId,
 *   });
 */
export async function requirePermission(
  permission: Permission,
  context?: ResourceContext,
): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthenticatedError();
  }

  const allowed = await canForUser(user, permission, context);
  if (!allowed) {
    throw new ForbiddenError(permission);
  }

  return user;
}

// ------------------------------------------------------------
// requireAnyPermission
// ------------------------------------------------------------

/**
 * Ensures the current user has at least one of the given permissions.
 * Useful for endpoints that accept multiple permission paths, e.g.:
 *   - generate report card (School Admin OR Principal OR Registrar)
 *
 * Throws UnauthenticatedError or ForbiddenError as above.
 * Returns the loaded CurrentUser on success.
 */
export async function requireAnyPermission(
  permissions: Permission[],
  context?: ResourceContext,
): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthenticatedError();
  }

  for (const permission of permissions) {
    const allowed = await canForUser(user, permission, context);
    if (allowed) {
      return user;
    }
  }

  // No permission matched. Report the first one for the error message.
  throw new ForbiddenError(permissions[0]);
}

// ------------------------------------------------------------
// requireRole
// ------------------------------------------------------------

/**
 * Ensures the current user has one of the given roles.
 * Prefer requirePermission() in most cases — this is for rare
 * operations that are strictly role-gated.
 *
 * Throws UnauthenticatedError or ForbiddenError.
 * Returns the loaded CurrentUser on success.
 */
export async function requireRole(
  roles: string[],
): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthenticatedError();
  }

  const hasRole = roles.some((r) => user.roles.includes(r));
  if (!hasRole) {
    // Construct a synthetic permission name for the error payload.
    throw new ForbiddenError(`role:${roles.join("|")}`);
  }

  return user;
}