"use server";

import { Role } from "@/generated/prisma/client";
import { logAudit } from "@/lib/audit";
import { actionSuccess, type ActionResult } from "@/lib/actions/types";
import { withPermission } from "@/lib/actions/helpers";
import {
  parentCreateSchema,
  parentUpdateSchema,
  type ParentCreateFormData,
  type ParentUpdateFormData,
} from "@/lib/formValidation";
import { prisma, softDeleteRecord } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const PARENTS_PATH = "/dashboard/admin/list/parents";

export async function createParent(
  data: ParentCreateFormData
): Promise<ActionResult<Awaited<ReturnType<typeof prisma.parent.create>>>> {
  return withPermission("parent:manage", async ({ userId }) => {
    const validated = parentCreateSchema.parse(data);
    const email = validated.email?.trim() || `${validated.username}@school.com`;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: validated.username }, { email }],
      },
    });

    if (existingUser) {
      return { success: false, error: "Username or email already exists" };
    }

    const existingParent = await prisma.parent.findFirst({
      where: {
        OR: [
          { username: validated.username },
          { phone: validated.phone },
          { email },
        ],
      },
    });

    if (existingParent) {
      return {
        success: false,
        error: "A parent with this username, email, or phone already exists",
      };
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const parent = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: validated.username,
          email,
          password: hashedPassword,
          role: Role.parent,
        },
      });

      return tx.parent.create({
        data: {
          id: user.id,
          username: validated.username,
          name: validated.name,
          surname: validated.surname,
          email,
          phone: validated.phone,
          address: validated.address,
        },
      });
    });

    await logAudit({
      userId,
      action: "CREATE",
      entity: "Parent",
      entityId: parent.id,
      description: `Created parent ${parent.name} ${parent.surname}`,
    });

    revalidatePath(PARENTS_PATH);
    return actionSuccess(parent);
  }, "Failed to create parent");
}

export async function updateParent(
  id: string,
  data: ParentUpdateFormData
): Promise<ActionResult<Awaited<ReturnType<typeof prisma.parent.update>>>> {
  return withPermission("parent:manage", async ({ userId }) => {
    const validated = parentUpdateSchema.parse(data);
    const email = validated.email?.trim() || `${validated.username}@school.com`;

    const existing = await prisma.parent.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Parent not found" };
    }

    const duplicate = await prisma.parent.findFirst({
      where: {
        OR: [
          { username: validated.username },
          { phone: validated.phone },
          { email },
        ],
        NOT: { id },
      },
    });

    if (duplicate) {
      return {
        success: false,
        error: "Username, email, or phone is already used by another parent",
      };
    }

    const duplicateUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: validated.username }, { email }],
        NOT: { id },
      },
    });

    if (duplicateUser) {
      return {
        success: false,
        error: "Username or email already exists on another account",
      };
    }

    const parent = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          username: validated.username,
          email,
        },
      });

      return tx.parent.update({
        where: { id },
        data: {
          username: validated.username,
          name: validated.name,
          surname: validated.surname,
          email,
          phone: validated.phone,
          address: validated.address,
        },
      });
    });

    await logAudit({
      userId,
      action: "UPDATE",
      entity: "Parent",
      entityId: id,
      description: `Updated parent ${parent.name} ${parent.surname}`,
    });

    revalidatePath(PARENTS_PATH);
    revalidatePath(`${PARENTS_PATH}/${id}`);
    revalidatePath(`${PARENTS_PATH}/${id}/edit`);
    return actionSuccess(parent);
  }, "Failed to update parent");
}

export async function deleteParent(id: string): Promise<ActionResult<void>> {
  return withPermission("parent:manage", async ({ userId }) => {
    const parent = await prisma.parent.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!parent) {
      return { success: false, error: "Parent not found" };
    }

    if (parent._count.students > 0) {
      return {
        success: false,
        error:
          "This parent has children enrolled. Reassign or remove the students before deleting.",
      };
    }

    await softDeleteRecord("parent", id);

    await logAudit({
      userId,
      action: "SOFT_DELETE",
      entity: "Parent",
      entityId: id,
      description: `Soft-deleted parent ${parent.name} ${parent.surname}`,
    });

    revalidatePath(PARENTS_PATH);
    return actionSuccess();
  }, "Failed to delete parent");
}
