// ============================================================
// Teacher Management Service (Admin)
// ============================================================

import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { logAudit } from "@/lib/audit/audit";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";

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

export async function listTeachers(actor: CurrentUser): Promise<TeacherListItem[]> {
  const allowed = await canForUser(actor, "teachers.read");
  if (!allowed) throw new ForbiddenError("teachers.read");

  const teachers = await prisma.teacher.findMany({
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

export async function createTeacher(
  actor: CurrentUser,
  input: CreateTeacherInput
) {
  const allowed = await canForUser(actor, "teachers.create");
  if (!allowed) throw new ForbiddenError("teachers.create");

  if (!input.firstName?.trim() || !input.lastName?.trim() || !input.email?.trim() || !input.phone?.trim()) {
    throw new ValidationError("First name, last name, email, and phone are required.");
  }

  const staffCode = `TCH-${Math.floor(1000 + Math.random() * 9000)}`;

  return prisma.$transaction(async (tx) => {
    // 1. Create User account for the teacher
    const username = input.email.split("@")[0] + Math.floor(Math.random() * 100);
    const teacherRole = await tx.role.findUnique({ where: { key: "TEACHER" } });

    const user = await tx.user.create({
      data: {
        email: input.email.trim().toLowerCase(),
        username,
        passwordHash: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8eklRpvGg.FvhJmi2u", // Default dev hash
        status: "ACTIVE",
        roles: teacherRole
          ? {
              create: { roleId: teacherRole.id },
            }
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
        email: input.email.trim().toLowerCase(),
        nationalId: input.nationalId?.trim() || null,
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
