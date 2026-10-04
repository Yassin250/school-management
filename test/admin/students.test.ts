// ============================================================
// Admin — Students Service Tests
// ============================================================

import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { testPrisma, resetDatabase, resetUserData } from "../setup";
import {
  createUser,
  createEducationLevel,
  createAcademicYear,
  createClass,
  createStudent,
  createTeacher,
  createTeacherAssignment,
  createEnrollment,
} from "../factories";
import { ROLES } from "../../src/lib/permissions/constants";
import type { CurrentUser } from "../../src/lib/auth/session";
import {
  createStudent as createStudentService,
  listStudents,
} from "../../src/lib/services/admin/students";
import { ForbiddenError, ValidationError } from "../../src/lib/errors";

// ------------------------------------------------------------
// buildCurrentUser
// ------------------------------------------------------------

async function buildCurrentUser(userId: string): Promise<CurrentUser> {
  const user = await testPrisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
      studentProfile: { select: { id: true } },
      parentProfile: { select: { id: true } },
      teacherProfile: { select: { id: true } },
      staffProfile: { select: { id: true } },
    },
  });
  if (!user) throw new Error(`User ${userId} not found`);

  const roles = user.roles.map((ur) => ur.role.key);
  const permissions = new Set<string>();
  for (const ur of user.roles) {
    for (const rp of ur.role.permissions) {
      permissions.add(rp.permission.key);
    }
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    roles,
    permissions,
    studentId: user.studentProfile?.id ?? null,
    parentId: user.parentProfile?.id ?? null,
    teacherId: user.teacherProfile?.id ?? null,
    staffProfileId: user.staffProfile?.id ?? null,
  };
}

// ------------------------------------------------------------
// Setup
// ------------------------------------------------------------

beforeAll(async () => {
  await resetDatabase();
  const { seedRbac } = await import("../../prisma/seed/rbac");
  await seedRbac(testPrisma);
});

beforeEach(async () => {
  await resetUserData();
});

// ============================================================
// createStudent
// ============================================================

describe("createStudent", () => {
  it("TEST-AS01: registrar can create a student", async () => {
    const { user } = await createUser(ROLES.REGISTRAR);
    const actor = await buildCurrentUser(user.id);

    const student = await createStudentService(actor, {
      firstName: "Test",
      lastName: "Learner",
      sex: "MALE",
      dateOfBirth: "2012-01-15",
    });

    expect(student.studentCode).toMatch(/^STU-\d{4}-\d{4}$/);
    expect(student.firstName).toBe("Test");
    expect(student.lastName).toBe("Learner");
    expect(student.status).toBe("ACTIVE");
  });

  it("TEST-AS02: teacher cannot create a student (no permission)", async () => {
    const { user } = await createUser(ROLES.TEACHER);
    const actor = await buildCurrentUser(user.id);

    await expect(
      createStudentService(actor, {
        firstName: "Test",
        lastName: "Learner",
        sex: "MALE",
        dateOfBirth: "2012-01-15",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("TEST-AS03: rejects missing first name", async () => {
    const { user } = await createUser(ROLES.REGISTRAR);
    const actor = await buildCurrentUser(user.id);

    await expect(
      createStudentService(actor, {
        firstName: "",
        lastName: "Learner",
        sex: "MALE",
        dateOfBirth: "2012-01-15",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-AS04: rejects missing date of birth", async () => {
    const { user } = await createUser(ROLES.REGISTRAR);
    const actor = await buildCurrentUser(user.id);

    await expect(
      createStudentService(actor, {
        firstName: "Test",
        lastName: "Learner",
        sex: "MALE",
        dateOfBirth: "",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-AS05: rejects duplicate national ID", async () => {
    const { user } = await createUser(ROLES.REGISTRAR);
    const actor = await buildCurrentUser(user.id);

    await createStudentService(actor, {
      firstName: "First",
      lastName: "Student",
      sex: "MALE",
      dateOfBirth: "2012-01-15",
      nationalId: "1234567890123456",
    });

    await expect(
      createStudentService(actor, {
        firstName: "Second",
        lastName: "Student",
        sex: "FEMALE",
        dateOfBirth: "2013-02-20",
        nationalId: "1234567890123456",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-AS06: writes an audit log on creation", async () => {
    const { user } = await createUser(ROLES.REGISTRAR);
    const actor = await buildCurrentUser(user.id);

    await createStudentService(actor, {
      firstName: "Audit",
      lastName: "Test",
      sex: "MALE",
      dateOfBirth: "2012-01-15",
    });

    const logs = await testPrisma.auditLog.findMany({
      where: {
        entity: "Student",
        action: "STUDENT_CREATED",
      },
    });

    expect(logs.length).toBe(1);
    expect(logs[0].actorId).toBe(actor.id);
  });

  it("TEST-AS07: creates an enrollment when class and year provided", async () => {
    const { user } = await createUser(ROLES.REGISTRAR);
    const actor = await buildCurrentUser(user.id);

    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-AS07");
    const cls = await createClass(year.id, level.id, { name: "S1 A - AS07" });

    const student = await createStudentService(actor, {
      firstName: "Enrolled",
      lastName: "Student",
      sex: "MALE",
      dateOfBirth: "2012-01-15",
      initialClassId: cls.id,
      academicYearId: year.id,
    });

    const enrollment = await testPrisma.enrollment.findFirst({
      where: { studentId: student.id },
    });

    expect(enrollment).not.toBeNull();
    expect(enrollment!.classId).toBe(cls.id);
    expect(enrollment!.status).toBe("ACTIVE");
  });

  it("TEST-AS08: rejects invalid class ID", async () => {
    const { user } = await createUser(ROLES.REGISTRAR);
    const actor = await buildCurrentUser(user.id);

    const year = await createAcademicYear("AY-AS08");

    await expect(
      createStudentService(actor, {
        firstName: "Invalid",
        lastName: "Class",
        sex: "MALE",
        dateOfBirth: "2012-01-15",
        initialClassId: "nonexistent-class-id",
        academicYearId: year.id,
      }),
    ).rejects.toThrow(ValidationError);
  });
});

// ============================================================
// listStudents
// ============================================================

describe("listStudents", () => {
  it("TEST-AS09: registrar can list students", async () => {
    const { user } = await createUser(ROLES.REGISTRAR);
    const actor = await buildCurrentUser(user.id);

    await createStudent({ studentCode: "STU-TEST-0001" });
    await createStudent({ studentCode: "STU-TEST-0002" });

    const result = await listStudents(actor);
    expect(result.total).toBe(2);
    expect(result.students.length).toBe(2);
  });

  it("TEST-AS10: list excludes soft-deleted students", async () => {
    const { user } = await createUser(ROLES.REGISTRAR);
    const actor = await buildCurrentUser(user.id);

    const s = await createStudent({ studentCode: "STU-TEST-DEL" });
    await testPrisma.student.update({
      where: { id: s.id },
      data: { deletedAt: new Date() },
    });

    const result = await listStudents(actor);
    expect(result.total).toBe(0);
  });

  it("TEST-AS11: teacher sees only students in their assigned classes", async () => {
    const { user: teacherUser } = await createUser(ROLES.TEACHER);

    const level = await createEducationLevel("P2", { order: 2 });
    const year = await createAcademicYear("AY-AS11");
    const classA = await createClass(year.id, level.id, { name: "P2 A - AS11" });
    const classB = await createClass(year.id, level.id, { name: "P2 B - AS11" });

    // Create teacher profile BEFORE building actor (so teacherId is populated)
    const teacher = await createTeacher(teacherUser.id);
    await createTeacherAssignment(teacher.id, classA.id, year.id);
    const actor = await buildCurrentUser(teacherUser.id);

    // Create students in both classes
    const s1 = await createStudent({ studentCode: "STU-AS11-A1" });
    const s2 = await createStudent({ studentCode: "STU-AS11-B1" });

    await createEnrollment(s1.id, year.id, classA.id, level.id);
    await createEnrollment(s2.id, year.id, classB.id, level.id);

    const result = await listStudents(actor);

    // Teacher should only see s1 (in classA)
    expect(result.total).toBe(1);
    expect(result.students[0].studentCode).toBe("STU-AS11-A1");
  });

  it("TEST-AS11b: teacher with no assignments sees empty list", async () => {
    const { user: teacherUser } = await createUser(ROLES.TEACHER);
    // Create teacher profile BEFORE building actor
    await createTeacher(teacherUser.id);
    const actor = await buildCurrentUser(teacherUser.id);

    const level = await createEducationLevel("P3", { order: 3 });
    const year = await createAcademicYear("AY-AS11b");
    const cls = await createClass(year.id, level.id, { name: "P3 A - AS11b" });

    const s = await createStudent({ studentCode: "STU-AS11b-1" });
    await createEnrollment(s.id, year.id, cls.id, level.id);

    const result = await listStudents(actor);
    expect(result.total).toBe(0);
  });
});