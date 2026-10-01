// ============================================================
// Admin — Teachers Service Tests
// ============================================================

import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { testPrisma, resetDatabase, resetUserData } from "../setup";
import { createUser } from "../factories";
import { ROLES } from "../../src/lib/permissions/constants";
import type { CurrentUser } from "../../src/lib/auth/session";
import {
  createTeacher as createTeacherService,
  listTeachers,
} from "../../src/lib/services/admin/teachers";
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
// createTeacher
// ============================================================

describe("createTeacher", () => {
  it("TEST-AT01: school admin can create a teacher", async () => {
    const { user } = await createUser(ROLES.SCHOOL_ADMIN);
    const actor = await buildCurrentUser(user.id);

    const teacher = await createTeacherService(actor, {
      firstName: "Alice",
      lastName: "Ngabo",
      sex: "FEMALE",
      phone: "+250780000001",
      email: "alice.ngabo@testschool.rw",
    });

    expect(teacher.staffCode).toMatch(/^TCH-\d{4}$/);
    expect(teacher.firstName).toBe("Alice");
    expect(teacher.lastName).toBe("Ngabo");
    expect(teacher.status).toBe("ACTIVE");
  });

  it("TEST-AT02: teacher cannot create teachers (no permission)", async () => {
    const { user } = await createUser(ROLES.TEACHER);
    const actor = await buildCurrentUser(user.id);

    await expect(
      createTeacherService(actor, {
        firstName: "T",
        lastName: "T",
        sex: "MALE",
        phone: "+250780000002",
        email: "t@testschool.rw",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("TEST-AT03: rejects missing required fields", async () => {
    const { user } = await createUser(ROLES.SCHOOL_ADMIN);
    const actor = await buildCurrentUser(user.id);

    await expect(
      createTeacherService(actor, {
        firstName: "",
        lastName: "T",
        sex: "MALE",
        phone: "+250780000003",
        email: "x@testschool.rw",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-AT04: rejects duplicate email", async () => {
    const { user } = await createUser(ROLES.SCHOOL_ADMIN);
    const actor = await buildCurrentUser(user.id);

    await createTeacherService(actor, {
      firstName: "First",
      lastName: "Teacher",
      sex: "MALE",
      phone: "+250780000004",
      email: "duplicate@testschool.rw",
    });

    await expect(
      createTeacherService(actor, {
        firstName: "Second",
        lastName: "Teacher",
        sex: "FEMALE",
        phone: "+250780000005",
        email: "duplicate@testschool.rw",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-AT05: creates a User account with TEACHER role", async () => {
    const { user } = await createUser(ROLES.SCHOOL_ADMIN);
    const actor = await buildCurrentUser(user.id);

    const teacher = await createTeacherService(actor, {
      firstName: "Role",
      lastName: "Check",
      sex: "MALE",
      phone: "+250780000006",
      email: "rolecheck@testschool.rw",
    });

    const userRoles = await testPrisma.userRole.findMany({
      where: { userId: teacher.userId },
      include: { role: { select: { key: true } } },
    });

    const roleKeys = userRoles.map((ur) => ur.role.key);
    expect(roleKeys).toContain("TEACHER");
  });

  it("TEST-AT06: writes an audit log", async () => {
    const { user } = await createUser(ROLES.SCHOOL_ADMIN);
    const actor = await buildCurrentUser(user.id);

    await createTeacherService(actor, {
      firstName: "Audit",
      lastName: "Teacher",
      sex: "MALE",
      phone: "+250780000007",
      email: "audit@testschool.rw",
    });

    const logs = await testPrisma.auditLog.findMany({
      where: { entity: "Teacher", action: "TEACHER_CREATED" },
    });

    expect(logs.length).toBe(1);
    expect(logs[0].actorId).toBe(actor.id);
  });

  it("TEST-AT07: teacher is created with mustChangePassword", async () => {
    const { user } = await createUser(ROLES.SCHOOL_ADMIN);
    const actor = await buildCurrentUser(user.id);

    const teacher = await createTeacherService(actor, {
      firstName: "Must",
      lastName: "Change",
      sex: "MALE",
      phone: "+250780000008",
      email: "mustchange@testschool.rw",
    });

    const u = await testPrisma.user.findUnique({
      where: { id: teacher.userId },
      select: { mustChangePassword: true },
    });

    expect(u?.mustChangePassword).toBe(true);
  });

  it("TEST-AT08: listTeachers returns the created teacher", async () => {
    const { user } = await createUser(ROLES.SCHOOL_ADMIN);
    const actor = await buildCurrentUser(user.id);

    await createTeacherService(actor, {
      firstName: "List",
      lastName: "Test",
      sex: "MALE",
      phone: "+250780000009",
      email: "listtest@testschool.rw",
    });

    const list = await listTeachers(actor);
    expect(list.length).toBe(1);
    expect(list[0].firstName).toBe("List");
  });
});