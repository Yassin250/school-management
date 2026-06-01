// src/lib/actions/exam.ts
"use server";

import { prisma } from "@/lib/prisma";
import {
  examSchema,
  type ExamFormData,
} from "@/lib/formValidation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const EXAMS_PATH = "/dashboard/admin/list/exams";

export async function createExam(data: ExamFormData) {
  try {
    const validated = examSchema.parse(data);

    // Validate lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: validated.lessonId },
    });

    if (!lesson) {
      return { success: false, error: "Selected lesson does not exist" };
    }

    const exam = await prisma.exam.create({
      data: {
        title: validated.title,
        startTime: new Date(validated.startTime),
        endTime: new Date(validated.endTime),
        lessonId: validated.lessonId,
      },
      include: {
        lesson: {
          select: {
            name: true,
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
        _count: {
          select: { results: true },
        },
      },
    });

    revalidatePath(EXAMS_PATH);
    return { success: true, data: exam };
  } catch (error) {
    console.error("Create exam error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to create exam" };
  }
}

export async function updateExam(id: number, data: ExamFormData) {
  try {
    const validated = examSchema.parse(data);

    // Check if exam exists
    const existing = await prisma.exam.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Exam not found" };
    }

    // Validate lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: validated.lessonId },
    });

    if (!lesson) {
      return { success: false, error: "Selected lesson does not exist" };
    }

    const exam = await prisma.exam.update({
      where: { id },
      data: {
        title: validated.title,
        startTime: new Date(validated.startTime),
        endTime: new Date(validated.endTime),
        lessonId: validated.lessonId,
      },
      include: {
        lesson: {
          select: {
            name: true,
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
        _count: {
          select: { results: true },
        },
      },
    });

    revalidatePath(EXAMS_PATH);
    revalidatePath(`${EXAMS_PATH}/${id}`);
    revalidatePath(`${EXAMS_PATH}/${id}/edit`);
    return { success: true, data: exam };
  } catch (error) {
    console.error("Update exam error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to update exam" };
  }
}

export async function deleteExam(id: number) {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id },
    });

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete all results for this exam
      await tx.result.deleteMany({
        where: { examId: id },
      });

      // 2. Delete the exam itself
      await tx.exam.delete({
        where: { id },
      });
    });

    revalidatePath(EXAMS_PATH);
    return { success: true };
  } catch (error) {
    console.error("Delete exam error:", error);
    return {
      success: false,
      error: "Failed to delete exam. It may have results linked.",
    };
  }
}