"use server";

import { logAudit } from "@/lib/audit";
import { actionSuccess, type ActionResult } from "@/lib/actions/types";
import { withPermission } from "@/lib/actions/helpers";
import { subjectSchema, type SubjectFormData } from "@/lib/formValidation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const SUBJECTS_PATH = "/dashboard/admin/list/subjects";

export async function createSubject(
  data: SubjectFormData
): Promise<ActionResult<Awaited<ReturnType<typeof prisma.subject.create>>>> {
  return withPermission("subject:manage", async ({ userId }) => {
    const validated = subjectSchema.parse(data);

    const existing = await prisma.subject.findUnique({
      where: { name: validated.name },
    });

    if (existing) {
      return { success: false, error: "A subject with this name already exists" };
    }

    const subject = await prisma.$transaction(async (tx) => {
      return tx.subject.create({
        data: {
          name: validated.name,
          teachers: {
            connect: validated.teachers.map((teacherId) => ({ id: teacherId })),
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
    });

    await logAudit({
      userId,
      action: "CREATE",
      entity: "Subject",
      entityId: String(subject.id),
      description: `Created subject ${subject.name}`,
    });

    revalidatePath(SUBJECTS_PATH);
    return actionSuccess(subject);
  }, "Failed to create subject");
}

export async function updateSubject(
  id: number,
  data: SubjectFormData
): Promise<ActionResult<Awaited<ReturnType<typeof prisma.subject.update>>>> {
  return withPermission("subject:manage", async ({ userId }) => {
    const validated = subjectSchema.parse(data);

    const existing = await prisma.subject.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Subject not found" };
    }

    const duplicate = await prisma.subject.findFirst({
      where: {
        name: validated.name,
        NOT: { id },
      },
    });

    if (duplicate) {
      return {
        success: false,
        error: "Another subject with this name already exists",
      };
    }

    const subject = await prisma.$transaction(async (tx) => {
      return tx.subject.update({
        where: { id },
        data: {
          name: validated.name,
          teachers: {
            set: [],
            connect: validated.teachers.map((teacherId) => ({ id: teacherId })),
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
    });

    await logAudit({
      userId,
      action: "UPDATE",
      entity: "Subject",
      entityId: String(id),
      description: `Updated subject ${subject.name}`,
    });

    revalidatePath(SUBJECTS_PATH);
    revalidatePath(`${SUBJECTS_PATH}/${id}`);
    revalidatePath(`${SUBJECTS_PATH}/${id}/edit`);
    return actionSuccess(subject);
  }, "Failed to update subject");
}

export async function deleteSubject(id: number): Promise<ActionResult<void>> {
  return withPermission("subject:manage", async ({ userId }) => {
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

    if (subject._count.lessons > 0) {
      return {
        success: false,
        error:
          "This subject has scheduled lessons. Remove lessons before deleting.",
      };
    }

    await prisma.subject.delete({ where: { id } });

    await logAudit({
      userId,
      action: "DELETE",
      entity: "Subject",
      entityId: String(id),
      description: `Deleted subject ${subject.name}`,
    });

    revalidatePath(SUBJECTS_PATH);
    return actionSuccess();
  }, "Failed to delete subject");
}
