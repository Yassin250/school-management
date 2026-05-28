// src/lib/actions/class.ts
"use server";

import { prisma } from "@/lib/prisma";
import {
  classSchema,
  type ClassFormData,
} from "@/lib/formValidation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CLASSES_PATH = "/dashboard/admin/list/classes";

export async function createClass(data: ClassFormData) {
  try {
    const validated = classSchema.parse(data);

    // Check if class name already exists
    const existing = await prisma.class.findUnique({
      where: { name: validated.name },
    });

    if (existing) {
      return { success: false, error: "A class with this name already exists" };
    }

    // Validate grade exists
    const grade = await prisma.grade.findUnique({
      where: { id: validated.gradeId },
    });

    if (!grade) {
      return { success: false, error: "Selected grade does not exist" };
    }

    // Validate supervisor if provided
    if (validated.supervisorId) {
      const supervisor = await prisma.teacher.findUnique({
        where: { id: validated.supervisorId },
      });

      if (!supervisor) {
        return { success: false, error: "Selected supervisor does not exist" };
      }
    }

    const newClass = await prisma.class.create({
      data: {
        name: validated.name,
        capacity: validated.capacity,
        gradeId: validated.gradeId,
        supervisorId: validated.supervisorId || null,
      },
      include: {
        grade: true,
        supervisor: {
          select: { id: true, name: true, surname: true },
        },
        _count: {
          select: { students: true },
        },
      },
    });

    revalidatePath(CLASSES_PATH);
    return { success: true, data: newClass };
  } catch (error) {
    console.error("Create class error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to create class" };
  }
}

export async function updateClass(id: number, data: ClassFormData) {
  try {
    const validated = classSchema.parse(data);

    // Check if class exists
    const existing = await prisma.class.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Class not found" };
    }

    // Check for duplicate name
    const duplicate = await prisma.class.findFirst({
      where: {
        name: validated.name,
        NOT: { id },
      },
    });

    if (duplicate) {
      return { success: false, error: "Another class with this name already exists" };
    }

    // Validate grade exists
    const grade = await prisma.grade.findUnique({
      where: { id: validated.gradeId },
    });

    if (!grade) {
      return { success: false, error: "Selected grade does not exist" };
    }

    // Validate supervisor if provided
    if (validated.supervisorId) {
      const supervisor = await prisma.teacher.findUnique({
        where: { id: validated.supervisorId },
      });

      if (!supervisor) {
        return { success: false, error: "Selected supervisor does not exist" };
      }
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        name: validated.name,
        capacity: validated.capacity,
        gradeId: validated.gradeId,
        supervisorId: validated.supervisorId || null,
      },
      include: {
        grade: true,
        supervisor: {
          select: { id: true, name: true, surname: true },
        },
        _count: {
          select: { students: true },
        },
      },
    });

    revalidatePath(CLASSES_PATH);
    revalidatePath(`${CLASSES_PATH}/${id}`);
    revalidatePath(`${CLASSES_PATH}/${id}/edit`);
    return { success: true, data: updatedClass };
  } catch (error) {
    console.error("Update class error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to update class" };
  }
}

export async function deleteClass(id: number) {
  try {
    const cls = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
            lessons: true,
          },
        },
      },
    });

    if (!cls) {
      return { success: false, error: "Class not found" };
    }

    // Check if class has students or lessons
    if (cls._count.students > 0) {
      return {
        success: false,
        error: "This class has students enrolled. Reassign students before deleting.",
      };
    }

    if (cls._count.lessons > 0) {
      return {
        success: false,
        error: "This class has scheduled lessons. Remove lessons before deleting.",
      };
    }

    await prisma.class.delete({ where: { id } });

    revalidatePath(CLASSES_PATH);
    return { success: true };
  } catch (error) {
    console.error("Delete class error:", error);
    return {
      success: false,
      error: "Failed to delete class. It may be linked to other records.",
    };
  }
}