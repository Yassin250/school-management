import type { Role } from "@/generated/prisma/client";
import {
  actionFailure,
  handleActionError,
  type ActionResult,
} from "@/lib/actions/types";
import {
  requirePermission,
  type Permission,
} from "@/lib/auth/permissions";

export async function withPermission<T>(
  permission: Permission,
  handler: (ctx: { userId: string; role: Role }) => Promise<ActionResult<T>>,
  fallbackError: string
): Promise<ActionResult<T>> {
  const authResult = await requirePermission(permission);

  if (!authResult.authorized) {
    return authResult.result;
  }

  try {
    return await handler({
      userId: authResult.userId,
      role: authResult.role,
    });
  } catch (error) {
    return handleActionError(error, fallbackError);
  }
}

export async function withAuth<T>(
  handler: (ctx: { userId: string; role: Role }) => Promise<ActionResult<T>>,
  fallbackError: string
): Promise<ActionResult<T>> {
  const { requireAuth } = await import("@/lib/auth/permissions");
  const authResult = await requireAuth();

  if (!authResult.authorized) {
    return authResult.result;
  }

  try {
    return await handler({
      userId: authResult.userId,
      role: authResult.role,
    });
  } catch (error) {
    return handleActionError(error, fallbackError);
  }
}

export function unauthorized(): ActionResult<never> {
  return actionFailure("Unauthorized. Please sign in.");
}
