// src/lib/actions/student.ts
"use server";

import { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  studentCreateSchema,
  studentUpdateSchema,
  type StudentCreateFormData,
  type StudentUpdateFormData,
} from "@/lib/formValidation";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const STUDENTS_PATH = "/dashboard/admin/list/students";

export async function createStudent(data: StudentCreateFormData) {
  try {
    const validated = studentCreateSchema.parse(data);
    const phone = validated.phone?.trim() || null;
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

    // Check existing student
    const existingStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { username: validated.username },
          ...(email ? [{ email }] : []),
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

    // Validate parent exists
    const parent = await prisma.parent.findUnique({
      where: { id: validated.parentId },
    });

    if (!parent) {
      return { success: false, error: "Selected parent does not exist" };
    }

    // Validate class exists
    const classExists = await prisma.class.findUnique({
      where: { id: parseInt(validated.classId) },
    });

    if (!classExists) {
      return { success: false, error: "Selected class does not exist" };
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const student = await prisma.$transaction(async (tx) => {
      // Create user account
      const user = await tx.user.create({
        data: {
          username: validated.username,
          email: email,
          password: hashedPassword,
          role: Role.student,
          img: validated.img || null,
        },
      });

      // Create student record
      return tx.student.create({
        data: {
          id: user.id,
          username: validated.username,
          name: validated.name,
          surname: validated.surname,
          email: email,
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

    revalidatePath(STUDENTS_PATH);
    return { success: true, data: student };
  } catch (error) {
    console.error("Create student error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to create student" };
  }
}

export async function updateStudent(id: string, data: StudentUpdateFormData) {
  try {
    const validated = studentUpdateSchema.parse(data);
    const phone = validated.phone?.trim() || null;
    const email = validated.email?.trim() || null;

    // Check if student exists
    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Student not found" };
    }

    // Check for duplicates
    const duplicate = await prisma.student.findFirst({
      where: {
        OR: [
          { username: validated.username },
          ...(email ? [{ email }] : []),
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

    // Validate relations
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
      // Update user account
      await tx.user.update({
        where: { id },
        data: {
          username: validated.username,
          email: email,
          img: validated.img || null,
        },
      });

      // Update student record
      return tx.student.update({
        where: { id },
        data: {
          username: validated.username,
          name: validated.name,
          surname: validated.surname,
          email: email,
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

    revalidatePath(STUDENTS_PATH);
    revalidatePath(`${STUDENTS_PATH}/${id}`);
    revalidatePath(`${STUDENTS_PATH}/${id}/edit`);
    return { success: true, data: student };
  } catch (error) {
    console.error("Update student error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to update student" };
  }
}

export async function deleteStudent(id: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attendances: true,  // ✅ FIXED: was 'attendance'
            results: true,
          },
        },
      },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Check for existing records
    if (student._count.attendances > 0 || student._count.results > 0) {  // ✅ FIXED: was 'attendance'
      return {
        success: false,
        error:
          "This student has attendance records or exam results. Remove those records before deleting.",
      };
    }

    await prisma.$transaction(async (tx) => {
      // Delete student record
      await tx.student.delete({ where: { id } });

      // Delete associated user account
      const user = await tx.user.findUnique({ where: { id } });
      if (user) {
        await tx.user.delete({ where: { id } });
      }
    });

    revalidatePath(STUDENTS_PATH);
    return { success: true };
  } catch (error) {
    console.error("Delete student error:", error);
    return {
      success: false,
      error: "Failed to delete student. They may be linked to other records.",
    };
  }
}

export async function getStudentById(id: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
        grade: true,
        parent: true,
        attendances: {  // ✅ FIXED: was 'attendance'
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