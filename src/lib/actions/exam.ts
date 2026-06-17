"use server";

import { logAudit } from "@/lib/audit";
import { actionSuccess, type ActionResult } from "@/lib/actions/types";
import { withPermission } from "@/lib/actions/helpers";
import { examSchema, type ExamFormData } from "@/lib/formValidation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const EXAMS_PATH = "/dashboard/admin/list/exams";

export async function createExam(
  data: ExamFormData
): Promise<ActionResult<Awaited<ReturnType<typeof prisma.exam.create>>>> {
  return withPermission("exam:manage", async ({ userId }) => {
    const validated = examSchema.parse(data);

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

    await logAudit({
      userId,
      action: "CREATE",
      entity: "Exam",
      entityId: String(exam.id),
      description: `Created exam ${exam.title}`,
    });

    revalidatePath(EXAMS_PATH);
    return actionSuccess(exam);
  }, "Failed to create exam");
}

export async function updateExam(
  id: number,
  data: ExamFormData
): Promise<ActionResult<Awaited<ReturnType<typeof prisma.exam.update>>>> {
  return withPermission("exam:manage", async ({ userId }) => {
    const validated = examSchema.parse(data);

    const existing = await prisma.exam.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Exam not found" };
    }

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

    await logAudit({
      userId,
      action: "UPDATE",
      entity: "Exam",
      entityId: String(id),
      description: `Updated exam ${exam.title}`,
    });

    revalidatePath(EXAMS_PATH);
    revalidatePath(`${EXAMS_PATH}/${id}`);
    revalidatePath(`${EXAMS_PATH}/${id}/edit`);
    return actionSuccess(exam);
  }, "Failed to update exam");
}

export async function deleteExam(id: number): Promise<ActionResult<void>> {
  return withPermission("exam:manage", async ({ userId }) => {
    const exam = await prisma.exam.findUnique({
      where: { id },
    });

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.result.deleteMany({
        where: { examId: id },
      });

      await tx.exam.delete({
        where: { id },
      });
    });

    await logAudit({
      userId,
      action: "DELETE",
      entity: "Exam",
      entityId: String(id),
      description: `Deleted exam ${exam.title}`,
    });

    revalidatePath(EXAMS_PATH);
    return actionSuccess();
  }, "Failed to delete exam");
}
