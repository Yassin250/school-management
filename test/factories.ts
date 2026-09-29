// ============================================================
// Test Factories
// ============================================================
// Create entities with sensible defaults. Every factory accepts
// overrides so tests only specify what matters.

import bcrypt from "bcryptjs";
import { testPrisma } from "./setup";
import type { RoleKey } from "../src/lib/permissions/constants";

// ------------------------------------------------------------
// Counter for unique suffixes
// ------------------------------------------------------------

let counter = 0;
function nextId(): string {
  counter++;
  return counter.toString().padStart(5, "0");
}

// ------------------------------------------------------------
// Users + Roles
// ------------------------------------------------------------

export async function createRole(key: RoleKey, name?: string) {
  return testPrisma.role.upsert({
    where: { key },
    update: {},
    create: {
      key,
      name: name ?? key.replace(/_/g, " "),
      isSystem: true,
    },
  });
}

export async function createUser(
  roleKey: RoleKey | RoleKey[],
  overrides: Partial<{
    email: string;
    username: string;
    password: string;
    status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  }> = {},
) {
  const id = nextId();
  const email = overrides.email ?? `user${id}@test.school`;
  const username = overrides.username ?? `user${id}`;
  const password = overrides.password ?? "TestPass123!";

  const passwordHash = await bcrypt.hash(password, 4);

  const roleKeys = Array.isArray(roleKey) ? roleKey : [roleKey];

  const user = await testPrisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      status: overrides.status ?? "ACTIVE",
    },
  });

  for (const key of roleKeys) {
    const role = await createRole(key);
    await testPrisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
      },
    });
  }

  return { user, password };
}

// ------------------------------------------------------------
// Education structure
// ------------------------------------------------------------

export async function createEducationLevel(
  code = "P1",
  overrides: Partial<{
    name: string;
    area: "GENERAL" | "TVET";
    order: number;
  }> = {},
) {
  return testPrisma.educationLevel.upsert({
    where: { code },
    update: {},
    create: {
      code,
      name: overrides.name ?? code,
      area: overrides.area ?? "GENERAL",
      order: overrides.order ?? 1,
    },
  });
}

export async function createAcademicYear(
  name = `AY-${nextId()}`,
  overrides: Partial<{
    startDate: Date;
    endDate: Date;
    isCurrent: boolean;
  }> = {},
) {
  return testPrisma.academicYear.create({
    data: {
      name,
      startDate: overrides.startDate ?? new Date("2026-09-01"),
      endDate: overrides.endDate ?? new Date("2027-06-30"),
      isCurrent: overrides.isCurrent ?? true,
    },
  });
}

export async function createTerm(
  academicYearId: string,
  name = `Term-${nextId()}`,
  overrides: Partial<{
    startDate: Date;
    endDate: Date;
    isCurrent: boolean;
  }> = {},
) {
  return testPrisma.term.create({
    data: {
      academicYearId,
      name,
      startDate: overrides.startDate ?? new Date("2026-09-01"),
      endDate: overrides.endDate ?? new Date("2026-12-15"),
      isCurrent: overrides.isCurrent ?? true,
    },
  });
}

// ------------------------------------------------------------
// Classes
// ------------------------------------------------------------

export async function createClass(
  academicYearId: string,
  educationLevelId: string,
  overrides: Partial<{
    name: string;
    stream: string;
    capacity: number;
    classTeacherId: string;
  }> = {},
) {
  return testPrisma.class.create({
    data: {
      name: overrides.name ?? `Class-${nextId()}`,
      academicYearId,
      educationLevelId,
      stream: overrides.stream ?? "A",
      capacity: overrides.capacity ?? 40,
      classTeacherId: overrides.classTeacherId,
    },
  });
}

// ------------------------------------------------------------
// Subjects
// ------------------------------------------------------------

export async function createSubject(
  code = `SUB-${nextId()}`,
  name = "Test Subject",
) {
  return testPrisma.subject.create({
    data: { code, name },
  });
}

// ------------------------------------------------------------
// People
// ------------------------------------------------------------

export async function createStudent(
  overrides: Partial<{
    userId: string;
    studentCode: string;
    firstName: string;
    lastName: string;
    sex: "MALE" | "FEMALE";
    dateOfBirth: Date;
  }> = {},
) {
  const id = nextId();
  return testPrisma.student.create({
    data: {
      userId: overrides.userId,
      studentCode: overrides.studentCode ?? `STU-${id}`,
      firstName: overrides.firstName ?? "Test",
      lastName: overrides.lastName ?? `Student${id}`,
      sex: overrides.sex ?? "MALE",
      dateOfBirth: overrides.dateOfBirth ?? new Date("2010-01-01"),
    },
  });
}

export async function createParent(
  overrides: Partial<{
    userId: string;
    firstName: string;
    lastName: string;
    phone: string;
  }> = {},
) {
  const id = nextId();
  return testPrisma.parent.create({
    data: {
      userId: overrides.userId,
      firstName: overrides.firstName ?? "Test",
      lastName: overrides.lastName ?? `Parent${id}`,
      phone: overrides.phone ?? `+250780${id.slice(-6)}`,
    },
  });
}

export async function createTeacher(
  userId: string,
  overrides: Partial<{
    staffCode: string;
    firstName: string;
    lastName: string;
    phone: string;
  }> = {},
) {
  const id = nextId();
  return testPrisma.teacher.create({
    data: {
      userId,
      staffCode: overrides.staffCode ?? `TCH-${id}`,
      firstName: overrides.firstName ?? "Test",
      lastName: overrides.lastName ?? `Teacher${id}`,
      sex: "FEMALE",
      phone: overrides.phone ?? `+250781${id.slice(-6)}`,
    },
  });
}

// ------------------------------------------------------------
// Enrollment
// ------------------------------------------------------------

export async function createEnrollment(
  studentId: string,
  academicYearId: string,
  classId: string,
  educationLevelId: string,
  overrides: Partial<{
    status: "ACTIVE" | "COMPLETED" | "WITHDRAWN" | "TRANSFERRED" | "REPEATED";
  }> = {},
) {
  return testPrisma.enrollment.create({
    data: {
      studentId,
      academicYearId,
      classId,
      educationLevelId,
      status: overrides.status ?? "ACTIVE",
      startDate: new Date(),
    },
  });
}

// ------------------------------------------------------------
// Parent-Student link
// ------------------------------------------------------------

export async function linkParentStudent(
  parentId: string,
  studentId: string,
  isPrimary = true,
) {
  return testPrisma.parentStudent.create({
    data: { parentId, studentId, isPrimary },
  });
}

// ------------------------------------------------------------
// Teacher assignment
// ------------------------------------------------------------

export async function createTeacherAssignment(
  teacherId: string,
  classId: string,
  academicYearId: string,
  subjectId?: string,
  moduleId?: string,
) {
  return testPrisma.teacherAssignment.create({
    data: {
      teacherId,
      classId,
      academicYearId,
      subjectId: subjectId ?? null,
      moduleId: moduleId ?? null,
    },
  });
}

// ------------------------------------------------------------
// Assessment
// ------------------------------------------------------------

export async function createAssessment(
  teacherId: string,
  classId: string,
  termId: string,
  subjectId: string,
  overrides: Partial<{
    title: string;
    type:
      | "QUIZ"
      | "ASSIGNMENT"
      | "TEST"
      | "MID_TERM"
      | "FINAL_EXAM"
      | "PROJECT"
      | "PRACTICAL";
    maxScore: number;
    weight: number;
    status:
      | "DRAFT"
      | "SUBMITTED"
      | "UNDER_REVIEW"
      | "APPROVED"
      | "RETURNED"
      | "LOCKED"
      | "CORRECTION_PENDING";
  }> = {},
) {
  const id = nextId();
  return testPrisma.assessment.create({
    data: {
      title: overrides.title ?? `Assessment-${id}`,
      type: overrides.type ?? "QUIZ",
      teacherId,
      classId,
      termId,
      subjectId,
      maxScore: overrides.maxScore ?? 100,
      weight: overrides.weight ?? 1,
      status: overrides.status ?? "DRAFT",
    },
  });
}

export async function createAssessmentResult(
  assessmentId: string,
  studentId: string,
  enteredById: string,
  overrides: Partial<{
    score: number | null;
    isAbsent: boolean;
  }> = {},
) {
  return testPrisma.assessmentResult.create({
    data: {
      assessmentId,
      studentId,
      score: overrides.score ?? null,
      isAbsent: overrides.isAbsent ?? false,
      enteredById,
    },
  });
}