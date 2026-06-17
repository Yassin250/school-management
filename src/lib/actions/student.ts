"use server";

import { Role } from "@/generated/prisma/client";
import { logAudit } from "@/lib/audit";
import {
  actionSuccess,
  type ActionResult,
} from "@/lib/actions/types";
import { withPermission } from "@/lib/actions/helpers";
import {
  studentCreateSchema,
  studentUpdateSchema,
  type StudentCreateFormData,
  type StudentUpdateFormData,
} from "@/lib/formValidation";
import { prisma, softDeleteRecord } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const STUDENTS_PATH = "/dashboard/admin/list/students";

export async function createStudent(
  data: StudentCreateFormData
): Promise<ActionResult<Awaited<ReturnType<typeof prisma.student.create>>>> {
  return withPermission("student:manage", async ({ userId }) => {
    const validated = studentCreateSchema.parse(data);
    const phone = validated.phone?.trim() || null;
    const email =
      validated.email?.trim() || `${validated.username}@school.com`;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: validated.username }, { email }],
      },
    });

    if (existingUser) {
      return { success: false, error: "Username or email already exists" };
    }

    const existingStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { username: validated.username },
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingStudent) {
      return {
        success: false,
        error: "A student with this username, email, or phone already exists",
      };
    }

    const parent = await prisma.parent.findUnique({
      where: { id: validated.parentId },
    });

    if (!parent) {
      return { success: false, error: "Selected parent does not exist" };
    }

    const classExists = await prisma.class.findUnique({
      where: { id: parseInt(validated.classId) },
    });

    if (!classExists) {
      return { success: false, error: "Selected class does not exist" };
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: validated.username,
          email,
          password: hashedPassword,
          role: Role.student,
          img: validated.img || null,
        },
      });

      return tx.student.create({
        data: {
          id: user.id,
          username: validated.username,
          name: validated.name,
          surname: validated.surname,
          email,
          phone,
          address: validated.address,
          sex: validated.sex,
          birthday: new Date(validated.birthday),
          img: validated.img || null,
          classId: parseInt(validated.classId),
          gradeId: parseInt(validated.gradeId),
          parentId: validated.parentId,
        },
        include: {
          class: true,
          grade: true,
          parent: true,
        },
      });
    });

    await logAudit({
      userId,
      action: "CREATE",
      entity: "Student",
      entityId: student.id,
      description: `Created student ${student.name} ${student.surname}`,
    });

    revalidatePath(STUDENTS_PATH);
    return actionSuccess(student);
  }, "Failed to create student");
}

export async function updateStudent(
  id: string,
  data: StudentUpdateFormData
): Promise<ActionResult<Awaited<ReturnType<typeof prisma.student.update>>>> {
  return withPermission("student:manage", async ({ userId }) => {
    const validated = studentUpdateSchema.parse(data);
    const phone = validated.phone?.trim() || null;
    const email =
      validated.email?.trim() || `${validated.username}@school.com`;

    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Student not found" };
    }

    const duplicate = await prisma.student.findFirst({
      where: {
        OR: [
          { username: validated.username },
          { email },
          ...(phone ? [{ phone }] : []),
        ],
        NOT: { id },
      },
    });

    if (duplicate) {
      return {
        success: false,
        error: "Username, email, or phone is already used by another student",
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

    const parent = await prisma.parent.findUnique({
      where: { id: validated.parentId },
    });

    if (!parent) {
      return { success: false, error: "Selected parent does not exist" };
    }

    const classExists = await prisma.class.findUnique({
      where: { id: parseInt(validated.classId) },
    });

    if (!classExists) {
      return { success: false, error: "Selected class does not exist" };
    }

    const student = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          username: validated.username,
          email,
          img: validated.img || null,
        },
      });

      return tx.student.update({
        where: { id },
        data: {
          username: validated.username,
          name: validated.name,
          surname: validated.surname,
          email,
          phone,
          address: validated.address,
          sex: validated.sex,
          birthday: new Date(validated.birthday),
          img: validated.img || null,
          classId: parseInt(validated.classId),
          gradeId: parseInt(validated.gradeId),
          parentId: validated.parentId,
        },
        include: {
          class: true,
          grade: true,
          parent: true,
        },
      });
    });

    await logAudit({
      userId,
      action: "UPDATE",
      entity: "Student",
      entityId: id,
      description: `Updated student ${student.name} ${student.surname}`,
    });

    revalidatePath(STUDENTS_PATH);
    revalidatePath(`${STUDENTS_PATH}/${id}`);
    revalidatePath(`${STUDENTS_PATH}/${id}/edit`);
    return actionSuccess(student);
  }, "Failed to update student");
}

export async function deleteStudent(id: string): Promise<ActionResult<void>> {
  return withPermission("student:manage", async ({ userId }) => {
    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    await softDeleteRecord("student", id);

    await logAudit({
      userId,
      action: "SOFT_DELETE",
      entity: "Student",
      entityId: id,
      description: `Soft-deleted student ${student.name} ${student.surname}`,
    });

    revalidatePath(STUDENTS_PATH);
    return actionSuccess();
  }, "Failed to delete student");
}

export async function getStudentById(id: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
        grade: true,
        parent: true,
        attendances: {
          take: 10,
          orderBy: { date: "desc" },
          include: {
            lesson: {
              select: {
                name: true,
                subject: {
                  select: { name: true },
                },
              },
            },
          },
        },
        results: {
          take: 10,
          orderBy: { exam: { startTime: "desc" } },
          include: {
            exam: {
              select: { title: true },
            },
            assignment: {
              select: { title: true },
            },
          },
        },
      },
    });

    if (!student) return null;

    return {
      ...student,
      parentName: `${student.parent.name} ${student.parent.surname}`,
    };
  } catch (error) {
    console.error("Get student error:", error);
    return null;
  }
}
