// ============================================================
// Session Resolver
// Loads the current user with roles and permissions in one query.
// ============================================================

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { UnauthenticatedError } from "@/lib/errors";

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
  status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  mustChangePassword: boolean;
  roles: string[];
  permissions: Set<string>;
  studentId: string | null;
  parentId: string | null;
  teacherId: string | null;
  staffProfileId: string | null;
}

export const getCurrentUser = cache(
  async (): Promise<CurrentUser | null> => {
    const { auth } = await import("@/auth");
    const session = await auth();
    if (!session?.user?.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        studentProfile: { select: { id: true } },
        parentProfile: { select: { id: true } },
        teacherProfile: { select: { id: true } },
        staffProfile: { select: { id: true } },
      },
    });

    if (!user) return null;
    if (user.status !== "ACTIVE") return null;
    if (user.deletedAt) return null;

    const roles = user.roles.map((ur) => ur.role.key);

    const permissionSet = new Set<string>();
    for (const ur of user.roles) {
      for (const rp of ur.role.permissions) {
        permissionSet.add(rp.permission.key);
      }
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      roles,
      permissions: permissionSet,
      studentId: user.studentProfile?.id ?? null,
      parentId: user.parentProfile?.id ?? null,
      teacherId: user.teacherProfile?.id ?? null,
      staffProfileId: user.staffProfile?.id ?? null,
    };
  },
);

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}