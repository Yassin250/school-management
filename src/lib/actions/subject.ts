// src/lib/actions/subject.ts
"use server";

import { prisma } from "@/lib/prisma";
import {
  subjectSchema,
  type SubjectFormData,
} from "@/lib/formValidation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const SUBJECTS_PATH = "/dashboard/admin/list/subjects";

export async function createSubject(data: SubjectFormData) {
  try {
    const validated = subjectSchema.parse(data);

    // Check if subject name already exists
    const existing = await prisma.subject.findUnique({
      where: { name: validated.name },
    });

    if (existing) {
      return { success: false, error: "A subject with this name already exists" };
    }

    const subject = await prisma.subject.create({
      data: {
        name: validated.name,
        teachers: {
          connect: validated.teachers.map((id) => ({ id })),
        },
      },
      include: {
        teachers: {
          select: { id: true, name: true, surname: true },
        },
        _count: {
          select: { lessons: true },
        },
      },
    });

    revalidatePath(SUBJECTS_PATH);
    return { success: true, data: subject };
  } catch (error) {
    console.error("Create subject error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to create subject" };
  }
}

export async function updateSubject(id: number, data: SubjectFormData) {
  try {
    const validated = subjectSchema.parse(data);

    // Check if subject exists
    const existing = await prisma.subject.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Subject not found" };
    }

    // Check for duplicate name
    const duplicate = await prisma.subject.findFirst({
      where: {
        name: validated.name,
        NOT: { id },
      },
    });

    if (duplicate) {
      return { success: false, error: "Another subject with this name already exists" };
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        name: validated.name,
        teachers: {
          set: [], // Clear existing
          connect: validated.teachers.map((id) => ({ id })),
        },
      },
      include: {
        teachers: {
          select: { id: true, name: true, surname: true },
        },
        _count: {
          select: { lessons: true },
        },
      },
    });

    revalidatePath(SUBJECTS_PATH);
    revalidatePath(`${SUBJECTS_PATH}/${id}`);
    revalidatePath(`${SUBJECTS_PATH}/${id}/edit`);
    return { success: true, data: subject };
  } catch (error) {
    console.error("Update subject error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to update subject" };
  }
}

export async function deleteSubject(id: number) {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    if (!subject) {
      return { success: false, error: "Subject not found" };
    }

    // Check if subject has lessons
    if (subject._count.lessons > 0) {
      return {
        success: false,
        error: "This subject has scheduled lessons. Remove lessons before deleting.",
      };
    }

    await prisma.subject.delete({ where: { id } });

    revalidatePath(SUBJECTS_PATH);
    return { success: true };
  } catch (error) {
    console.error("Delete subject error:", error);
    return {
      success: false,
      error: "Failed to delete subject. It may be linked to lessons.",
    };
  }
}