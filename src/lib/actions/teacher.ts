"use server";

import { Role } from "@/generated/prisma/client";
import { logAudit } from "@/lib/audit";
import { actionSuccess, type ActionResult } from "@/lib/actions/types";
import { withPermission } from "@/lib/actions/helpers";
import {
  teacherCreateSchema,
  teacherUpdateSchema,
  type TeacherCreateFormData,
  type TeacherUpdateFormData,
} from "@/lib/formValidation";
import { prisma, softDeleteRecord } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const TEACHERS_PATH = "/dashboard/admin/list/teachers";

function toSubjectConnect(subjectIds: number[]) {
  return subjectIds.map((id) => ({ id }));
}

function toClassConnect(classIds: number[]) {
  return classIds.map((id) => ({ id }));
}

export async function createTeacher(
  data: TeacherCreateFormData
): Promise<ActionResult<Awaited<ReturnType<typeof prisma.teacher.create>>>> {
  return withPermission("teacher:manage", async ({ userId }) => {
    const validated = teacherCreateSchema.parse(data);
    const phone = validated.phone?.trim() || null;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: validated.username }, { email: validated.email }],
      },
    });

    if (existingUser) {
      return { success: false, error: "Username or email already exists" };
    }

    const existingTeacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { username: validated.username },
          { email: validated.email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingTeacher) {
      return {
        success: false,
        error: "A teacher with this username, email, or phone already exists",
      };
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const teacher = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: validated.username,
          email: validated.email,
          password: hashedPassword,
          role: Role.teacher,
          img: validated.img || null,
        },
      });

      return tx.teacher.create({
        data: {
          id: user.id,
          username: validated.username,
          name: validated.name,
          surname: validated.surname,
          email: validated.email,
          phone,
          address: validated.address,
          sex: validated.sex,
          birthday: new Date(validated.birthday),
          img: validated.img || null,
          subjects: { connect: toSubjectConnect(validated.subjects) },
          ...(validated.classes.length > 0 && {
            supervisedClasses: { connect: toClassConnect(validated.classes) },
          }),
        },
      });
    });

    await logAudit({
      userId,
      action: "CREATE",
      entity: "Teacher",
      entityId: teacher.id,
      description: `Created teacher ${teacher.name} ${teacher.surname}`,
    });

    revalidatePath(TEACHERS_PATH);
    return actionSuccess(teacher);
  }, "Failed to create teacher");
}

export async function updateTeacher(
  id: string,
  data: TeacherUpdateFormData
): Promise<ActionResult<Awaited<ReturnType<typeof prisma.teacher.update>>>> {
  return withPermission("teacher:manage", async ({ userId }) => {
    const validated = teacherUpdateSchema.parse({ ...data, id });
    const phone = validated.phone?.trim() || null;

    const existing = await prisma.teacher.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Teacher not found" };
    }

    const duplicate = await prisma.teacher.findFirst({
      where: {
        OR: [
          { username: validated.username },
          { email: validated.email },
          ...(phone ? [{ phone }] : []),
        ],
        NOT: { id },
      },
    });

    if (duplicate) {
      return {
        success: false,
        error: "Username, email, or phone is already used by another teacher",
      };
    }

    const duplicateUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: validated.username }, { email: validated.email }],
        NOT: { id },
      },
    });

    if (duplicateUser) {
      return {
        success: false,
        error: "Username or email already exists on another account",
      };
    }

    const teacher = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          username: validated.username,
          email: validated.email,
          img: validated.img || null,
        },
      });

      return tx.teacher.update({
        where: { id },
        data: {
          username: validated.username,
          name: validated.name,
          surname: validated.surname,
          email: validated.email,
          phone,
          address: validated.address,
          sex: validated.sex,
          birthday: new Date(validated.birthday),
          img: validated.img || null,
          subjects: { set: toSubjectConnect(validated.subjects) },
          supervisedClasses: { set: toClassConnect(validated.classes) },
        },
      });
    });

    await logAudit({
      userId,
      action: "UPDATE",
      entity: "Teacher",
      entityId: id,
      description: `Updated teacher ${teacher.name} ${teacher.surname}`,
    });

    revalidatePath(TEACHERS_PATH);
    revalidatePath(`${TEACHERS_PATH}/${id}`);
    revalidatePath(`${TEACHERS_PATH}/${id}/edit`);
    return actionSuccess(teacher);
  }, "Failed to update teacher");
}

export async function deleteTeacher(id: string): Promise<ActionResult<void>> {
  return withPermission("teacher:manage", async ({ userId }) => {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { _count: { select: { lessons: true } } },
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    if (teacher._count.lessons > 0) {
      return {
        success: false,
        error:
          "This teacher has scheduled lessons. Reassign or remove those lessons before deleting.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.class.updateMany({
        where: { supervisorId: id },
        data: { supervisorId: null },
      });
    });

    await softDeleteRecord("teacher", id);

    await logAudit({
      userId,
      action: "SOFT_DELETE",
      entity: "Teacher",
      entityId: id,
      description: `Soft-deleted teacher ${teacher.name} ${teacher.surname}`,
    });

    revalidatePath(TEACHERS_PATH);
    return actionSuccess();
  }, "Failed to delete teacher");
}
