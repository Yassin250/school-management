// ============================================================
// Student Management Service (Admin / Registrar)
// ============================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { logAudit } from "@/lib/audit/audit";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  sex: "MALE" | "FEMALE";
  dateOfBirth: string;
  nationality?: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  address?: string;
  placeOfBirth?: string;
  admissionDate?: string;
  initialClassId?: string;
  academicYearId?: string;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

async function generateStudentCode(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const random = Math.floor(1000 + Math.random() * 9000);
    const code = `STU-${year}-${random}`;
    const existing = await tx.student.findUnique({
      where: { studentCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  // Deterministic fallback to avoid collisions
  return `STU-${year}-${Date.now().toString().slice(-6)}`;
}

// ------------------------------------------------------------
// listStudents
// ------------------------------------------------------------

export async function listStudents(
  actor: CurrentUser,
  params: {
    query?: string;
    classId?: string;
    status?: "ACTIVE" | "GRADUATED" | "TRANSFERRED" | "WITHDRAWN";
    take?: number;
    skip?: number;
  } = {},
) {
  const allowed = await canForUser(actor, "students.read");
  if (!allowed) throw new ForbiddenError("students.read");

  const { query, classId, status, take = 50, skip = 0 } = params;

  const where: Prisma.StudentWhereInput = {
    deletedAt: null,
  };

  if (status) where.status = status;

  if (query && query.trim()) {
    const q = query.trim();
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { studentCode: { contains: q, mode: "insensitive" } },
      { nationalId: { contains: q, mode: "insensitive" } },
    ];
  }

  if (classId) {
    where.enrollments = {
      some: { classId, status: "ACTIVE" },
    };
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            class: true,
            academicYear: true,
            educationLevel: true,
          },
          take: 1,
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take,
      skip,
    }),
    prisma.student.count({ where }),
  ]);

  return {
    students: students.map((s) => ({
      id: s.id,
      studentCode: s.studentCode,
      firstName: s.firstName,
      lastName: s.lastName,
      sex: s.sex,
      dateOfBirth: s.dateOfBirth,
      nationality: s.nationality,
      nationalId: s.nationalId,
      phone: s.phone,
      email: s.email,
      status: s.status,
      admissionDate: s.admissionDate,
      currentClass: s.enrollments[0]?.class?.name ?? "Unassigned",
      currentLevel: s.enrollments[0]?.educationLevel?.name ?? "-",
    })),
    total,
  };
}

// ------------------------------------------------------------
// createStudent
// ------------------------------------------------------------

export async function createStudent(
  actor: CurrentUser,
  input: CreateStudentInput,
) {
  const allowed = await canForUser(actor, "students.create");
  if (!allowed) throw new ForbiddenError("students.create");

  if (!input.firstName?.trim() || !input.lastName?.trim()) {
    throw new ValidationError("First name and last name are required.");
  }
  if (!input.dateOfBirth) {
    throw new ValidationError("Date of birth is required.");
  }
  if (input.sex !== "MALE" && input.sex !== "FEMALE") {
    throw new ValidationError("Sex must be MALE or FEMALE.");
  }

  const trimmedNationalId = input.nationalId?.trim() || null;

  // Duplicate national ID check
  if (trimmedNationalId) {
    const existingNationalId = await prisma.student.findUnique({
      where: { nationalId: trimmedNationalId },
      select: { id: true },
    });
    if (existingNationalId) {
      throw new ValidationError(
        `A student with national ID ${trimmedNationalId} already exists.`,
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const studentCode = await generateStudentCode(tx);

    const student = await tx.student.create({
      data: {
        studentCode,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        sex: input.sex,
        dateOfBirth: new Date(input.dateOfBirth),
        nationality: input.nationality?.trim() || "Rwandan",
        nationalId: trimmedNationalId,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        address: input.address?.trim() || null,
        placeOfBirth: input.placeOfBirth?.trim() || null,
        admissionDate: input.admissionDate
          ? new Date(input.admissionDate)
          : new Date(),
        status: "ACTIVE",
      },
    });

    // Optional initial enrollment
    if (input.initialClassId && input.academicYearId) {
      const cls = await tx.class.findUnique({
        where: { id: input.initialClassId },
        select: {
          id: true,
          educationLevelId: true,
          pathwayId: true,
          tradeId: true,
        },
      });

      if (!cls) {
        throw new ValidationError(
          `Class ${input.initialClassId} not found.`,
        );
      }

      const academicYear = await tx.academicYear.findUnique({
        where: { id: input.academicYearId },
        select: { id: true },
      });

      if (!academicYear) {
        throw new ValidationError(
          `Academic year ${input.academicYearId} not found.`,
        );
      }

      await tx.enrollment.create({
        data: {
          studentId: student.id,
          academicYearId: academicYear.id,
          educationLevelId: cls.educationLevelId,
          classId: cls.id,
          pathwayId: cls.pathwayId,
          tradeId: cls.tradeId,
          status: "ACTIVE",
          startDate: new Date(),
        },
      });
    }

    await logAudit({
      actorId: actor.id,
      action: "STUDENT_CREATED",
      entity: "Student",
      entityId: student.id,
      newValue: {
        studentCode: student.studentCode,
        firstName: student.firstName,
        lastName: student.lastName,
        nationalId: student.nationalId,
      },
      tx,
    });

    return student;
  });
}