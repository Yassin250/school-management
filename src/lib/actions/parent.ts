// src/lib/actions/parent.ts
"use server";

import { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  parentCreateSchema,
  parentUpdateSchema,
  type ParentCreateFormData,
  type ParentUpdateFormData,
} from "@/lib/formValidation";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const PARENTS_PATH = "/dashboard/admin/list/parents";

export async function createParent(data: ParentCreateFormData) {
  try {
    const validated = parentCreateSchema.parse(data);
    const email = validated.email?.trim() || null;

    // Check existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: validated.username },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existingUser) {
      return { success: false, error: "Username or email already exists" };
    }

    // Check existing parent
    const existingParent = await prisma.parent.findFirst({
      where: {
        OR: [
          { username: validated.username },
          { phone: validated.phone },
          ...(email ? [{ email }] : []),
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
      // Create user account
      const user = await tx.user.create({
        data: {
          username: validated.username,
          email: email,
          password: hashedPassword,
          role: Role.parent,
        },
      });

      // Create parent record
      return tx.parent.create({
        data: {
          id: user.id,
          username: validated.username,
          name: validated.name,
          surname: validated.surname,
          email: email,
          phone: validated.phone,
          address: validated.address,
        },
      });
    });

    revalidatePath(PARENTS_PATH);
    return { success: true, data: parent };
  } catch (error) {
    console.error("Create parent error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to create parent" };
  }
}

export async function updateParent(id: string, data: ParentUpdateFormData) {
  try {
    const validated = parentUpdateSchema.parse(data);
    const email = validated.email?.trim() || null;

    // Check if parent exists
    const existing = await prisma.parent.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Parent not found" };
    }

    // Check for duplicates
    const duplicate = await prisma.parent.findFirst({
      where: {
        OR: [
          { username: validated.username },
          { phone: validated.phone },
          ...(email ? [{ email }] : []),
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

    // Check user duplicates
    const duplicateUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: validated.username },
          ...(email ? [{ email }] : []),
        ],
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
      // Update user account
      await tx.user.update({
        where: { id },
        data: {
          username: validated.username,
          email: email,
        },
      });

      // Update parent record
      return tx.parent.update({
        where: { id },
        data: {
          username: validated.username,
          name: validated.name,
          surname: validated.surname,
          email: email,
          phone: validated.phone,
          address: validated.address,
        },
      });
    });

    revalidatePath(PARENTS_PATH);
    revalidatePath(`${PARENTS_PATH}/${id}`);
    revalidatePath(`${PARENTS_PATH}/${id}/edit`);
    return { success: true, data: parent };
  } catch (error) {
    console.error("Update parent error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to update parent" };
  }
}

export async function deleteParent(id: string) {
  try {
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

    // Check if parent has children
    if (parent._count.students > 0) {
      return {
        success: false,
        error:
          "This parent has children enrolled. Reassign or remove the students before deleting.",
      };
    }

    await prisma.$transaction(async (tx) => {
      // Delete parent record
      await tx.parent.delete({ where: { id } });

      // Delete associated user account
      const user = await tx.user.findUnique({ where: { id } });
      if (user) {
        await tx.user.delete({ where: { id } });
      }
    });

    revalidatePath(PARENTS_PATH);
    return { success: true };
  } catch (error) {
    console.error("Delete parent error:", error);
    return {
      success: false,
      error: "Failed to delete parent. They may have children enrolled.",
    };
  }
}