// ============================================================
// RBAC Authorization Tests
// ============================================================

import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { testPrisma, resetDatabase, resetUserData } from "../setup";
import {
  createUser,
  createStudent,
  createParent,
  createTeacher,
  linkParentStudent,
  createEducationLevel,
  createAcademicYear,
  createClass,
  createSubject,
  createEnrollment,
  createTeacherAssignment,
} from "../factories";
import { ROLES, PERMISSIONS } from "../../src/lib/permissions/constants";
import { canForUser } from "../../src/lib/permissions/can";
import type { CurrentUser } from "../../src/lib/auth/session";

// ------------------------------------------------------------
// Build a CurrentUser from a database user
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
// 1. Authentication
// ============================================================

describe("Authentication", () => {
  it("TEST-01: unauthenticated user → can() returns false", async () => {
    const result = await canForUser(null, PERMISSIONS.STUDENTS_READ);
    expect(result).toBe(false);
  });

  it("TEST-02: suspended user status is preserved", async () => {
    const { user } = await createUser(ROLES.STUDENT, {
      status: "SUSPENDED",
    });
    const currentUser = await buildCurrentUser(user.id);
    expect(currentUser.status).toBe("SUSPENDED");
  });
});

// ============================================================
// 2. Teacher
// ============================================================

describe("Teacher authorization", () => {
  it("TEST-03: teacher can read assigned class", async () => {
    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-T03");
    const subject = await createSubject("MATH-T03");

    const { user: teacherUser } = await createUser(ROLES.TEACHER);
    const teacher = await createTeacher(teacherUser.id);

    const cls = await createClass(year.id, level.id, {
      name: "S1A-T03",
      classTeacherId: teacher.id,
    });
    await createTeacherAssignment(teacher.id, cls.id, year.id, subject.id);

    const currentUser = await buildCurrentUser(teacherUser.id);
    const allowed = await canForUser(currentUser, PERMISSIONS.CLASSES_READ, {
      type: "class",
      classId: cls.id,
    });

    expect(allowed).toBe(true);
  });

  it("TEST-04: teacher cannot read unrelated class", async () => {
    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-T04");

    const { user: t1User } = await createUser(ROLES.TEACHER);
    const t1 = await createTeacher(t1User.id);

    const { user: t2User } = await createUser(ROLES.TEACHER);
    const t2 = await createTeacher(t2User.id);

    await createClass(year.id, level.id, {
      name: "S1A-T04",
      classTeacherId: t1.id,
    });
    const cls2 = await createClass(year.id, level.id, {
      name: "S1B-T04",
      classTeacherId: t2.id,
    });

    const currentUser = await buildCurrentUser(t1User.id);
    const allowed = await canForUser(currentUser, PERMISSIONS.CLASSES_READ, {
      type: "class",
      classId: cls2.id,
    });

    expect(allowed).toBe(false);
  });

  it("TEST-05: teacher can read student in assigned class", async () => {
    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-T05");
    const subject = await createSubject("MATH-T05");

    const { user: tUser } = await createUser(ROLES.TEACHER);
    const teacher = await createTeacher(tUser.id);

    const cls = await createClass(year.id, level.id, { name: "S1A-T05" });
    await createTeacherAssignment(teacher.id, cls.id, year.id, subject.id);

    const { user: sUser } = await createUser(ROLES.STUDENT);
    const student = await createStudent({ userId: sUser.id });
    await createEnrollment(student.id, year.id, cls.id, level.id);

    const currentUser = await buildCurrentUser(tUser.id);
    const allowed = await canForUser(currentUser, PERMISSIONS.STUDENTS_READ, {
      type: "student",
      studentId: student.id,
    });

    expect(allowed).toBe(true);
  });

  it("TEST-06: teacher cannot read student in another class", async () => {
    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-T06");
    const subject = await createSubject("MATH-T06");

    const { user: tUser } = await createUser(ROLES.TEACHER);
    const teacher = await createTeacher(tUser.id);

    const cls1 = await createClass(year.id, level.id, { name: "S1A-T06" });
    const cls2 = await createClass(year.id, level.id, { name: "S1B-T06" });
    await createTeacherAssignment(teacher.id, cls1.id, year.id, subject.id);

    const { user: sUser } = await createUser(ROLES.STUDENT);
    const student = await createStudent({ userId: sUser.id });
    await createEnrollment(student.id, year.id, cls2.id, level.id);

    const currentUser = await buildCurrentUser(tUser.id);
    const allowed = await canForUser(currentUser, PERMISSIONS.STUDENTS_READ, {
      type: "student",
      studentId: student.id,
    });

    expect(allowed).toBe(false);
  });

  it("TEST-07: teacher has grades.submit but not grades.approve", async () => {
    const { user } = await createUser(ROLES.TEACHER);
    const currentUser = await buildCurrentUser(user.id);

    const canSubmit = await canForUser(currentUser, PERMISSIONS.GRADES_SUBMIT);
    const canApprove = await canForUser(currentUser, PERMISSIONS.GRADES_APPROVE);

    expect(canSubmit).toBe(true);
    expect(canApprove).toBe(false);
  });

  it("TEST-08: teacher cannot request post-lock correction", async () => {
    const { user } = await createUser(ROLES.TEACHER);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(
      currentUser,
      PERMISSIONS.GRADES_REQUEST_POST_LOCK_CORRECTION,
    );
    expect(allowed).toBe(false);
  });
});

// ============================================================
// 3. Principal
// ============================================================

describe("Principal authorization", () => {
  it("TEST-09: principal can approve grades", async () => {
    const { user } = await createUser(ROLES.PRINCIPAL);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(currentUser, PERMISSIONS.GRADES_APPROVE);
    expect(allowed).toBe(true);
  });

  it("TEST-10: principal can review grades", async () => {
    const { user } = await createUser(ROLES.PRINCIPAL);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(currentUser, PERMISSIONS.GRADES_REVIEW);
    expect(allowed).toBe(true);
  });

  it("TEST-11: principal cannot manage security", async () => {
    const { user } = await createUser(ROLES.PRINCIPAL);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(currentUser, PERMISSIONS.SECURITY_MANAGE);
    expect(allowed).toBe(false);
  });

  it("TEST-12: principal can read school-wide students", async () => {
    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-T12");
    const cls = await createClass(year.id, level.id, { name: "S1A-T12" });

    const { user: sUser } = await createUser(ROLES.STUDENT);
    const student = await createStudent({ userId: sUser.id });
    await createEnrollment(student.id, year.id, cls.id, level.id);

    const { user: pUser } = await createUser(ROLES.PRINCIPAL);
    const currentUser = await buildCurrentUser(pUser.id);

    const allowed = await canForUser(currentUser, PERMISSIONS.STUDENTS_READ, {
      type: "student",
      studentId: student.id,
    });
    expect(allowed).toBe(true);
  });
});

// ============================================================
// 4. Accountant
// ============================================================

describe("Accountant authorization", () => {
  it("TEST-13: accountant can create invoices", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(currentUser, PERMISSIONS.INVOICES_CREATE);
    expect(allowed).toBe(true);
  });

  it("TEST-14: accountant can record payments", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(currentUser, PERMISSIONS.PAYMENTS_CREATE);
    expect(allowed).toBe(true);
  });

  it("TEST-15: accountant can view financial reports", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(
      currentUser,
      PERMISSIONS.FINANCIAL_REPORTS_READ,
    );
    expect(allowed).toBe(true);
  });

  it("TEST-16: accountant cannot approve grades", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(currentUser, PERMISSIONS.GRADES_APPROVE);
    expect(allowed).toBe(false);
  });

  it("TEST-17: accountant cannot enter grades", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(currentUser, PERMISSIONS.GRADES_ENTER);
    expect(allowed).toBe(false);
  });
});

// ============================================================
// 5. Registrar
// ============================================================

describe("Registrar authorization", () => {
  it("TEST-18: registrar can create students", async () => {
    const { user } = await createUser(ROLES.REGISTRAR);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(currentUser, PERMISSIONS.STUDENTS_CREATE);
    expect(allowed).toBe(true);
  });

  it("TEST-19: registrar can manage enrollments", async () => {
    const { user } = await createUser(ROLES.REGISTRAR);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(
      currentUser,
      PERMISSIONS.ENROLLMENTS_CREATE,
    );
    expect(allowed).toBe(true);
  });

  it("TEST-20: registrar cannot approve grades", async () => {
    const { user } = await createUser(ROLES.REGISTRAR);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(currentUser, PERMISSIONS.GRADES_APPROVE);
    expect(allowed).toBe(false);
  });
});

// ============================================================
// 6. Parent
// ============================================================

describe("Parent authorization", () => {
  it("TEST-21: parent can read their own child", async () => {
    const { user: pUser } = await createUser(ROLES.PARENT);
    const parent = await createParent({ userId: pUser.id });

    const { user: sUser } = await createUser(ROLES.STUDENT);
    const student = await createStudent({ userId: sUser.id });
    await linkParentStudent(parent.id, student.id);

    const currentUser = await buildCurrentUser(pUser.id);
    const allowed = await canForUser(currentUser, PERMISSIONS.STUDENTS_READ, {
      type: "student",
      studentId: student.id,
    });

    expect(allowed).toBe(true);
  });

  it("TEST-22: parent cannot read unrelated student (IDOR)", async () => {
    const { user: pUser } = await createUser(ROLES.PARENT);
    await createParent({ userId: pUser.id });

    const { user: sUser } = await createUser(ROLES.STUDENT);
    const student = await createStudent({ userId: sUser.id });
    // no link between parent and this student

    const currentUser = await buildCurrentUser(pUser.id);
    const allowed = await canForUser(currentUser, PERMISSIONS.STUDENTS_READ, {
      type: "student",
      studentId: student.id,
    });

    expect(allowed).toBe(false);
  });

  it("TEST-23: parent cannot edit grades", async () => {
    const { user } = await createUser(ROLES.PARENT);
    const currentUser = await buildCurrentUser(user.id);

    const canEdit = await canForUser(currentUser, PERMISSIONS.GRADES_EDIT);
    const canEnter = await canForUser(currentUser, PERMISSIONS.GRADES_ENTER);

    expect(canEdit).toBe(false);
    expect(canEnter).toBe(false);
  });

  it("TEST-24: parent can read but not approve report cards", async () => {
    const { user } = await createUser(ROLES.PARENT);
    const currentUser = await buildCurrentUser(user.id);

    const canRead = await canForUser(
      currentUser,
      PERMISSIONS.REPORT_CARDS_READ,
    );
    const canApprove = await canForUser(
      currentUser,
      PERMISSIONS.REPORT_CARDS_APPROVE,
    );

    expect(canRead).toBe(true);
    expect(canApprove).toBe(false);
  });
});

// ============================================================
// 7. Student
// ============================================================

describe("Student authorization", () => {
  it("TEST-25: student can read own record", async () => {
    const { user: sUser } = await createUser(ROLES.STUDENT);
    const student = await createStudent({ userId: sUser.id });

    const currentUser = await buildCurrentUser(sUser.id);
    const allowed = await canForUser(currentUser, PERMISSIONS.STUDENTS_READ, {
      type: "student",
      studentId: student.id,
    });

    expect(allowed).toBe(true);
  });

  it("TEST-26: student cannot read another student's record", async () => {
    const { user: s1User } = await createUser(ROLES.STUDENT);
    await createStudent({ userId: s1User.id });

    const { user: s2User } = await createUser(ROLES.STUDENT);
    const student2 = await createStudent({ userId: s2User.id });

    const currentUser = await buildCurrentUser(s1User.id);
    const allowed = await canForUser(currentUser, PERMISSIONS.STUDENTS_READ, {
      type: "student",
      studentId: student2.id,
    });

    expect(allowed).toBe(false);
  });

  it("TEST-27: student cannot download report card PDF", async () => {
    const { user } = await createUser(ROLES.STUDENT);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(
      currentUser,
      PERMISSIONS.REPORT_CARDS_DOWNLOAD,
    );
    expect(allowed).toBe(false);
  });

  it("TEST-28: student can read own grades", async () => {
    const { user } = await createUser(ROLES.STUDENT);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(currentUser, PERMISSIONS.GRADES_READ);
    expect(allowed).toBe(true);
  });
});

// ============================================================
// 8. System Administrator
// ============================================================

describe("System Administrator authorization", () => {
  it("TEST-29: sysadmin can manage roles", async () => {
    const { user } = await createUser(ROLES.SYSTEM_ADMIN);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(currentUser, PERMISSIONS.ROLES_CREATE);
    expect(allowed).toBe(true);
  });

  it("TEST-30: sysadmin can manage permissions", async () => {
    const { user } = await createUser(ROLES.SYSTEM_ADMIN);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(
      currentUser,
      PERMISSIONS.PERMISSIONS_ASSIGN,
    );
    expect(allowed).toBe(true);
  });

  it("TEST-31: sysadmin can manage security", async () => {
    const { user } = await createUser(ROLES.SYSTEM_ADMIN);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(currentUser, PERMISSIONS.SECURITY_MANAGE);
    expect(allowed).toBe(true);
  });

  it("TEST-32: sysadmin can read audit logs", async () => {
    const { user } = await createUser(ROLES.SYSTEM_ADMIN);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(
      currentUser,
      PERMISSIONS.AUDIT_LOGS_READ,
    );
    expect(allowed).toBe(true);
  });

  it("TEST-33: sysadmin does NOT automatically have grades.approve", async () => {
    const { user } = await createUser(ROLES.SYSTEM_ADMIN);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(currentUser, PERMISSIONS.GRADES_APPROVE);
    expect(allowed).toBe(false);
  });

  it("TEST-34: sysadmin does NOT automatically have payments.create", async () => {
    const { user } = await createUser(ROLES.SYSTEM_ADMIN);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canForUser(currentUser, PERMISSIONS.PAYMENTS_CREATE);
    expect(allowed).toBe(false);
  });
});

// ============================================================
// 9. Default deny
// ============================================================

describe("Default deny", () => {
  it("TEST-35: user with no permissions is denied everything", async () => {
    const user = await testPrisma.user.create({
      data: {
        email: `noperm${Date.now()}@test.school`,
        username: `noperm${Date.now()}`,
        passwordHash: "x",
      },
    });

    const currentUser = await buildCurrentUser(user.id);
    const allowed = await canForUser(currentUser, PERMISSIONS.STUDENTS_READ);
    expect(allowed).toBe(false);
  });
});