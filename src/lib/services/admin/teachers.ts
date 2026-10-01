// ============================================================
// Teacher Management Service (Admin)
// ============================================================

import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { logAudit } from "@/lib/audit/audit";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";

const DEFAULT_TEACHER_PASSWORD =
  process.env.DEFAULT_TEACHER_PASSWORD ?? "ChangeMe123!";

export interface CreateTeacherInput {
  firstName: string;
  lastName: string;
  sex: "MALE" | "FEMALE";
  phone: string;
  email: string;
  nationalId?: string;
  qualification?: string;
  hireDate?: string;
}

export interface TeacherAssignmentItem {
  id: string;
  className: string;
  subjectName: string;
}

export interface TeacherListItem {
  id: string;
  staffCode: string;
  name: string;
  firstName: string;
  lastName: string;
  sex: string;
  phone: string;
  email: string;
  qualification: string;
  status: string;
  activeAssignmentsCount: number;
  assignments: TeacherAssignmentItem[];
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

async function generateStaffCode(
  tx: Prisma.TransactionClient,
): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = `TCH-${Math.floor(1000 + Math.random() * 9000)}`;
    const existing = await tx.teacher.findUnique({
      where: { staffCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  return `TCH-${Date.now().toString().slice(-6)}`;
}

async function generateUsername(
  tx: Prisma.TransactionClient,
  email: string,
): Promise<string> {
  const base =
    email
      .split("@")[0]
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase() || "user";

  for (let i = 0; i < 5; i++) {
    const candidate = i === 0 ? base : `${base}${i}`;
    const existing = await tx.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  return `${base}${Date.now().toString().slice(-4)}`;
}

// ------------------------------------------------------------
// listTeachers
// ------------------------------------------------------------

export async function listTeachers(
  actor: CurrentUser,
): Promise<TeacherListItem[]> {
  const allowed = await canForUser(actor, "teachers.read");
  if (!allowed) throw new ForbiddenError("teachers.read");

  const teachers = await prisma.teacher.findMany({
    where: { deletedAt: null },
    include: {
      user: { select: { email: true, username: true } },
      assignments: {
        include: {
          class: true,
          subject: true,
          module: true,
        },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return teachers.map((t) => ({
    id: t.id,
    staffCode: t.staffCode,
    name: `${t.firstName} ${t.lastName}`,
    firstName: t.firstName,
    lastName: t.lastName,
    sex: t.sex,
    phone: t.phone,
    email: t.email ?? t.user.email,
    qualification: t.qualification ?? "Certified Teacher",
    status: t.status,
    activeAssignmentsCount: t.assignments.length,
    assignments: t.assignments.map((a) => ({
      id: a.id,
      className: a.class.name,
      subjectName: a.subject?.name ?? a.module?.name ?? "General",
    })),
  }));
}

// ------------------------------------------------------------
// createTeacher
// ------------------------------------------------------------

export async function createTeacher(
  actor: CurrentUser,
  input: CreateTeacherInput,
) {
  const allowed = await canForUser(actor, "teachers.create");
  if (!allowed) throw new ForbiddenError("teachers.create");

  if (
    !input.firstName?.trim() ||
    !input.lastName?.trim() ||
    !input.email?.trim() ||
    !input.phone?.trim()
  ) {
    throw new ValidationError(
      "First name, last name, email, and phone are required.",
    );
  }

  if (input.sex !== "MALE" && input.sex !== "FEMALE") {
    throw new ValidationError("Sex must be MALE or FEMALE.");
  }

  const email = input.email.trim().toLowerCase();
  const trimmedNationalId = input.nationalId?.trim() || null;

  // Duplicate email check
  const existingEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingEmail) {
    throw new ValidationError(`A user with email ${email} already exists.`);
  }

  // Duplicate national ID check
  if (trimmedNationalId) {
    const existingNationalId = await prisma.teacher.findUnique({
      where: { nationalId: trimmedNationalId },
      select: { id: true },
    });
    if (existingNationalId) {
      throw new ValidationError(
        `A teacher with national ID ${trimmedNationalId} already exists.`,
      );
    }
  }

  const passwordHash = await bcrypt.hash(DEFAULT_TEACHER_PASSWORD, 12);

  return prisma.$transaction(async (tx) => {
    const staffCode = await generateStaffCode(tx);
    const username = await generateUsername(tx, email);

    const teacherRole = await tx.role.findUnique({
      where: { key: "TEACHER" },
      select: { id: true },
    });

    // 1. Create User account
    const user = await tx.user.create({
      data: {
        email,
        username,
        passwordHash,
        mustChangePassword: true,
        status: "ACTIVE",
        roles: teacherRole
          ? { create: { roleId: teacherRole.id } }
          : undefined,
      },
    });

    // 2. Create Teacher profile
    const teacher = await tx.teacher.create({
      data: {
        userId: user.id,
        staffCode,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        sex: input.sex,
        phone: input.phone.trim(),
        email,
        nationalId: trimmedNationalId,
        qualification: input.qualification?.trim() || null,
        hireDate: input.hireDate ? new Date(input.hireDate) : new Date(),
        status: "ACTIVE",
      },
    });

    await logAudit({
      actorId: actor.id,
      action: "TEACHER_CREATED",
      entity: "Teacher",
      entityId: teacher.id,
      newValue: {
        staffCode: teacher.staffCode,
        name: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email,
      },
      tx,
    });

    return teacher;
  });
}