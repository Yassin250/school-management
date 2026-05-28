"use server";

import { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  teacherCreateSchema,
  teacherUpdateSchema,
  type TeacherCreateFormData,
  type TeacherUpdateFormData,
} from "@/lib/formValidation";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TEACHERS_PATH = "/dashboard/admin/list/teachers";

function toSubjectConnect(subjectIds: number[]) {
  return subjectIds.map((id) => ({ id }));
}

function toClassConnect(classIds: number[]) {
  return classIds.map((id) => ({ id }));
}

export async function createTeacher(data: TeacherCreateFormData) {
  try {
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

    revalidatePath(TEACHERS_PATH);
    return { success: true, data: teacher };
  } catch (error) {
    console.error("Create teacher error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to create teacher" };
  }
}

export async function updateTeacher(id: string, data: TeacherUpdateFormData) {
  try {
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
      return { success: false, error: "Username or email already exists on another account" };
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

    revalidatePath(TEACHERS_PATH);
    revalidatePath(`${TEACHERS_PATH}/${id}`);
    revalidatePath(`${TEACHERS_PATH}/${id}/edit`);
    return { success: true, data: teacher };
  } catch (error) {
    console.error("Update teacher error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to update teacher" };
  }
}

export async function deleteTeacher(id: string) {
  try {
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

      await tx.teacher.delete({ where: { id } });

      const user = await tx.user.findUnique({ where: { id } });
      if (user) {
        await tx.user.delete({ where: { id } });
      }
    });

    revalidatePath(TEACHERS_PATH);
    return { success: true };
  } catch (error) {
    console.error("Delete teacher error:", error);
    return { success: false, error: "Failed to delete teacher. They may be linked to other records." };
  }
}
