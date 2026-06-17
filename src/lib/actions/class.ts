"use server";

import { logAudit } from "@/lib/audit";
import { actionSuccess, type ActionResult } from "@/lib/actions/types";
import { withPermission } from "@/lib/actions/helpers";
import {
  classSchema,
  type ClassFormData,
  type ClassFormInput,
} from "@/lib/formValidation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const CLASSES_PATH = "/dashboard/admin/list/classes";

export async function createClass(
  data: ClassFormInput
): Promise<ActionResult<Awaited<ReturnType<typeof prisma.class.create>>>> {
  return withPermission("class:manage", async ({ userId }) => {
    const validated = classSchema.parse(data);

    const existing = await prisma.class.findUnique({
      where: { name: validated.name },
    });

    if (existing) {
      return { success: false, error: "A class with this name already exists" };
    }

    const grade = await prisma.grade.findUnique({
      where: { id: validated.gradeId },
    });

    if (!grade) {
      return { success: false, error: "Selected grade does not exist" };
    }

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

    await logAudit({
      userId,
      action: "CREATE",
      entity: "Class",
      entityId: String(newClass.id),
      description: `Created class ${newClass.name}`,
    });

    revalidatePath(CLASSES_PATH);
    return actionSuccess(newClass);
  }, "Failed to create class");
}

export async function updateClass(
  id: number,
  data: ClassFormInput
): Promise<ActionResult<Awaited<ReturnType<typeof prisma.class.update>>>> {
  return withPermission("class:manage", async ({ userId }) => {
    const validated = classSchema.parse(data);

    const existing = await prisma.class.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Class not found" };
    }

    const duplicate = await prisma.class.findFirst({
      where: {
        name: validated.name,
        NOT: { id },
      },
    });

    if (duplicate) {
      return {
        success: false,
        error: "Another class with this name already exists",
      };
    }

    const grade = await prisma.grade.findUnique({
      where: { id: validated.gradeId },
    });

    if (!grade) {
      return { success: false, error: "Selected grade does not exist" };
    }

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

    await logAudit({
      userId,
      action: "UPDATE",
      entity: "Class",
      entityId: String(id),
      description: `Updated class ${updatedClass.name}`,
    });

    revalidatePath(CLASSES_PATH);
    revalidatePath(`${CLASSES_PATH}/${id}`);
    revalidatePath(`${CLASSES_PATH}/${id}/edit`);
    return actionSuccess(updatedClass);
  }, "Failed to update class");
}

export async function deleteClass(id: number): Promise<ActionResult<void>> {
  return withPermission("class:manage", async ({ userId }) => {
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

    if (cls._count.students > 0) {
      return {
        success: false,
        error:
          "This class has students enrolled. Reassign students before deleting.",
      };
    }

    if (cls._count.lessons > 0) {
      return {
        success: false,
        error:
          "This class has scheduled lessons. Remove lessons before deleting.",
      };
    }

    await prisma.class.delete({ where: { id } });

    await logAudit({
      userId,
      action: "DELETE",
      entity: "Class",
      entityId: String(id),
      description: `Deleted class ${cls.name}`,
    });

    revalidatePath(CLASSES_PATH);
    return actionSuccess();
  }, "Failed to delete class");
}
