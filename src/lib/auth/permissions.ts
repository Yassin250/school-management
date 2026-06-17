import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/client";
import { actionFailure, type ActionResult } from "@/lib/actions/types";

export type Permission =
  | "admin:manage"
  | "teacher:manage"
  | "student:manage"
  | "parent:manage"
  | "class:manage"
  | "subject:manage"
  | "exam:manage"
  | "event:manage"
  | "announcement:manage"
  | "lesson:manage"
  | "attendance:manage"
  | "grade:manage"
  | "assignment:manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "admin:manage",
    "teacher:manage",
    "student:manage",
    "parent:manage",
    "class:manage",
    "subject:manage",
    "exam:manage",
    "event:manage",
    "announcement:manage",
    "lesson:manage",
    "attendance:manage",
    "grade:manage",
    "assignment:manage",
  ],
  teacher: [
    "attendance:manage",
    "grade:manage",
    "assignment:manage",
    "exam:manage",
  ],
  student: [],
  parent: [],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export async function requireAuth(): Promise<
  | { authorized: true; userId: string; role: Role }
  | { authorized: false; result: ActionResult<never> }
> {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    return {
      authorized: false,
      result: actionFailure("Unauthorized. Please sign in."),
    };
  }

  return {
    authorized: true,
    userId: session.user.id,
    role: session.user.role as Role,
  };
}

export async function requirePermission(
  permission: Permission
): Promise<
  | { authorized: true; userId: string; role: Role }
  | { authorized: false; result: ActionResult<never> }
> {
  const authResult = await requireAuth();

  if (!authResult.authorized) {
    return authResult;
  }

  if (!roleHasPermission(authResult.role, permission)) {
    return {
      authorized: false,
      result: actionFailure("You do not have permission to perform this action."),
    };
  }

  return authResult;
}
