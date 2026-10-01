// ============================================================
// RBAC Scope Resolvers — Deep Isolation Tests
// ============================================================
// These tests verify IDOR protection and cross-tenant isolation
// for every resource scope resolver in src/lib/permissions/scope.ts.
//
// The authorization.test.ts suite verified permission checks.
// This suite verifies SCOPE — WHICH records a user may access.
// ============================================================

import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { testPrisma, resetDatabase } from "../setup";
import {
  createUser,
  createStudent,
  createParent,
  createTeacher,
  linkParentStudent,
  createEducationLevel,
  createAcademicYear,
  createTerm,
  createClass,
  createSubject,
  createEnrollment,
  createTeacherAssignment,
  createAssessment,
} from "../factories";
import { ROLES } from "../../src/lib/permissions/constants";
import {
  canAccessStudent,
  canAccessClass,
  canAccessAssessment,
  canAccessReportCard,
  canAccessInvoice,
  canAccessAttendance,
  canAccessAnnouncement,
} from "../../src/lib/permissions/scope";
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
// Setup — seed RBAC once for the whole file
// ------------------------------------------------------------

beforeAll(async () => {
  await resetDatabase();
  const { seedRbac } = await import("../../prisma/seed/rbac");
  await seedRbac(testPrisma);
});

beforeEach(async () => {
  // Wipe user-generated data between tests (keep roles/permissions)
  await testPrisma.assessmentResult.deleteMany();
  await testPrisma.assessment.deleteMany();
  await testPrisma.attendance.deleteMany();
  await testPrisma.lesson.deleteMany();
  await testPrisma.timetableVersion.deleteMany();
  await testPrisma.teacherAssignment.deleteMany();
  await testPrisma.enrollment.deleteMany();
  await testPrisma.invoiceDiscount.deleteMany();
  await testPrisma.payment.deleteMany();
  await testPrisma.receipt.deleteMany();
  await testPrisma.invoiceItem.deleteMany();
  await testPrisma.invoice.deleteMany();
  await testPrisma.reportCardItem.deleteMany();
  await testPrisma.reportCard.deleteMany();
  await testPrisma.parentStudent.deleteMany();
  await testPrisma.student.deleteMany();
  await testPrisma.parent.deleteMany();
  await testPrisma.teacher.deleteMany();
  await testPrisma.class.deleteMany();
  await testPrisma.subject.deleteMany();
  await testPrisma.term.deleteMany();
  await testPrisma.academicYear.deleteMany();
  await testPrisma.educationLevel.deleteMany();
  await testPrisma.announcement.deleteMany();
  await testPrisma.userRole.deleteMany();
  await testPrisma.user.deleteMany();
  await testPrisma.auditLog.deleteMany();
});

// ============================================================
// SECTION 1 — Assessment scope
// ============================================================

describe("Assessment scope", () => {
  it("TEST-S01: teacher CAN access their own assessment", async () => {
    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-S01");
    const term = await createTerm(year.id, "T1-S01");
    const subject = await createSubject("MATH-S01");

    const { user: tUser } = await createUser(ROLES.TEACHER);
    const teacher = await createTeacher(tUser.id);
    const cls = await createClass(year.id, level.id, { name: "S1-A-S01" });

    await createTeacherAssignment(teacher.id, cls.id, year.id, subject.id);

    const assessment = await createAssessment(
      teacher.id,
      cls.id,
      term.id,
      subject.id,
    );

    const currentUser = await buildCurrentUser(tUser.id);

    const allowed = await canAccessAssessment(currentUser, assessment.id);
    expect(allowed).toBe(true);
  });

  it("TEST-S02: teacher CANNOT access another teacher's assessment", async () => {
    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-S02");
    const term = await createTerm(year.id, "T1-S02");
    const subject = await createSubject("MATH-S02");

    const { user: t1User } = await createUser(ROLES.TEACHER);
    const t1 = await createTeacher(t1User.id);

    const { user: t2User } = await createUser(ROLES.TEACHER);
    const t2 = await createTeacher(t2User.id);

    const cls1 = await createClass(year.id, level.id, { name: "S1-A-S02" });
    const cls2 = await createClass(year.id, level.id, { name: "S1-B-S02" });

    await createTeacherAssignment(t1.id, cls1.id, year.id, subject.id);
    await createTeacherAssignment(t2.id, cls2.id, year.id, subject.id);

    // Assessment belongs to T1
    const assessment = await createAssessment(
      t1.id,
      cls1.id,
      term.id,
      subject.id,
    );

    // T2 tries to access it
    const currentUser = await buildCurrentUser(t2User.id);
    const allowed = await canAccessAssessment(currentUser, assessment.id);

    expect(allowed).toBe(false);
  });

  it("TEST-S03: principal CAN access any assessment (school-wide)", async () => {
    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-S03");
    const term = await createTerm(year.id, "T1-S03");
    const subject = await createSubject("MATH-S03");

    const { user: tUser } = await createUser(ROLES.TEACHER);
    const teacher = await createTeacher(tUser.id);
    const cls = await createClass(year.id, level.id, { name: "S1-A-S03" });
    await createTeacherAssignment(teacher.id, cls.id, year.id, subject.id);

    const assessment = await createAssessment(
      teacher.id,
      cls.id,
      term.id,
      subject.id,
    );

    const { user: pUser } = await createUser(ROLES.PRINCIPAL);
    const currentUser = await buildCurrentUser(pUser.id);

    const allowed = await canAccessAssessment(currentUser, assessment.id);
    expect(allowed).toBe(true);
  });

  it("TEST-S04: student CAN access an assessment for their class", async () => {
    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-S04");
    const term = await createTerm(year.id, "T1-S04");
    const subject = await createSubject("MATH-S04");

    const { user: tUser } = await createUser(ROLES.TEACHER);
    const teacher = await createTeacher(tUser.id);
    const cls = await createClass(year.id, level.id, { name: "S1-A-S04" });
    await createTeacherAssignment(teacher.id, cls.id, year.id, subject.id);

    const { user: sUser } = await createUser(ROLES.STUDENT);
    const student = await createStudent({ userId: sUser.id });
    await createEnrollment(student.id, year.id, cls.id, level.id);

    const assessment = await createAssessment(
      teacher.id,
      cls.id,
      term.id,
      subject.id,
    );

    const currentUser = await buildCurrentUser(sUser.id);
    const allowed = await canAccessAssessment(currentUser, assessment.id);

    expect(allowed).toBe(true);
  });

  it("TEST-S05: student CANNOT access an assessment from another class", async () => {
    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-S05");
    const term = await createTerm(year.id, "T1-S05");
    const subject = await createSubject("MATH-S05");

    const { user: tUser } = await createUser(ROLES.TEACHER);
    const teacher = await createTeacher(tUser.id);
    const cls1 = await createClass(year.id, level.id, { name: "S1-A-S05" });
    const cls2 = await createClass(year.id, level.id, { name: "S1-B-S05" });
    await createTeacherAssignment(teacher.id, cls1.id, year.id, subject.id);

    // Student is in class 2
    const { user: sUser } = await createUser(ROLES.STUDENT);
    const student = await createStudent({ userId: sUser.id });
    await createEnrollment(student.id, year.id, cls2.id, level.id);

    // Assessment is for class 1
    const assessment = await createAssessment(
      teacher.id,
      cls1.id,
      term.id,
      subject.id,
    );

    const currentUser = await buildCurrentUser(sUser.id);
    const allowed = await canAccessAssessment(currentUser, assessment.id);

    expect(allowed).toBe(false);
  });

  it("TEST-S06: non-existent assessment → false", async () => {
    const { user } = await createUser(ROLES.PRINCIPAL);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canAccessAssessment(currentUser, "nonexistent-id");
    expect(allowed).toBe(false);
  });
});

// ============================================================
// SECTION 2 — Student scope
// ============================================================

describe("Student scope (IDOR prevention)", () => {
  it("TEST-S07: parent A CANNOT read parent B's child", async () => {
    const { user: pAUser } = await createUser(ROLES.PARENT);
    await createParent({ userId: pAUser.id });

    const { user: pBUser } = await createUser(ROLES.PARENT);
    const parentB = await createParent({ userId: pBUser.id });

    const { user: sUser } = await createUser(ROLES.STUDENT);
    const childB = await createStudent({ userId: sUser.id });
    await linkParentStudent(parentB.id, childB.id);

    const currentUser = await buildCurrentUser(pAUser.id);

    const allowed = await canAccessStudent(currentUser, childB.id);
    expect(allowed).toBe(false);
  });

  it("TEST-S08: student A CANNOT read student B's record", async () => {
    const { user: sAUser } = await createUser(ROLES.STUDENT);
    await createStudent({ userId: sAUser.id });

    const { user: sBUser } = await createUser(ROLES.STUDENT);
    const studentB = await createStudent({ userId: sBUser.id });

    const currentUser = await buildCurrentUser(sAUser.id);

    const allowed = await canAccessStudent(currentUser, studentB.id);
    expect(allowed).toBe(false);
  });

  it("TEST-S09: teacher CANNOT read a student from another class", async () => {
    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-S09");
    const subject = await createSubject("MATH-S09");

    const { user: tUser } = await createUser(ROLES.TEACHER);
    const teacher = await createTeacher(tUser.id);
    const myClass = await createClass(year.id, level.id, { name: "S1-A-S09" });
    const otherClass = await createClass(year.id, level.id, {
      name: "S1-B-S09",
    });

    await createTeacherAssignment(
      teacher.id,
      myClass.id,
      year.id,
      subject.id,
    );

    const { user: sUser } = await createUser(ROLES.STUDENT);
    const student = await createStudent({ userId: sUser.id });
    await createEnrollment(student.id, year.id, otherClass.id, level.id);

    const currentUser = await buildCurrentUser(tUser.id);

    const allowed = await canAccessStudent(currentUser, student.id);
    expect(allowed).toBe(false);
  });

  it("TEST-S10: accountant CAN read any student (financial context)", async () => {
    const { user: aUser } = await createUser(ROLES.ACCOUNTANT);
    const { user: sUser } = await createUser(ROLES.STUDENT);
    const student = await createStudent({ userId: sUser.id });

    const currentUser = await buildCurrentUser(aUser.id);

    const allowed = await canAccessStudent(currentUser, student.id);
    expect(allowed).toBe(true);
  });

  it("TEST-S11: non-existent student → false", async () => {
    const { user } = await createUser(ROLES.STUDENT);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canAccessStudent(currentUser, "nonexistent");
    expect(allowed).toBe(false);
  });
});

// ============================================================
// SECTION 3 — Class scope
// ============================================================

describe("Class scope", () => {
  it("TEST-S12: teacher as class teacher CAN access that class", async () => {
    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-S12");

    const { user: tUser } = await createUser(ROLES.TEACHER);
    const teacher = await createTeacher(tUser.id);
    const cls = await createClass(year.id, level.id, {
      name: "S1-A-S12",
      classTeacherId: teacher.id,
    });

    const currentUser = await buildCurrentUser(tUser.id);
    const allowed = await canAccessClass(currentUser, cls.id);

    expect(allowed).toBe(true);
  });

  it("TEST-S13: teacher NOT assigned to a class CANNOT access it", async () => {
    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-S13");

    const { user: tUser } = await createUser(ROLES.TEACHER);
    const cls = await createClass(year.id, level.id, { name: "S1-A-S13" });
    // No assignment for this teacher

    const currentUser = await buildCurrentUser(tUser.id);
    const allowed = await canAccessClass(currentUser, cls.id);

    expect(allowed).toBe(false);
  });
});

// ============================================================
// SECTION 4 — Attendance scope
// ============================================================

describe("Attendance scope", () => {
  it("TEST-S14: teacher CAN access attendance for their class", async () => {
    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-S14");
    const term = await createTerm(year.id, "T1-S14");
    const subject = await createSubject("MATH-S14");

    const { user: tUser } = await createUser(ROLES.TEACHER);
    const teacher = await createTeacher(tUser.id);
    const cls = await createClass(year.id, level.id, { name: "S1-A-S14" });
    await createTeacherAssignment(teacher.id, cls.id, year.id, subject.id);

    const { user: sUser } = await createUser(ROLES.STUDENT);
    const student = await createStudent({ userId: sUser.id });
    await createEnrollment(student.id, year.id, cls.id, level.id);

    const tv = await testPrisma.timetableVersion.create({
      data: { academicYearId: year.id, termId: term.id, version: 1 },
    });

    const lesson = await testPrisma.lesson.create({
      data: {
        timetableVersionId: tv.id,
        academicYearId: year.id,
        termId: term.id,
        classId: cls.id,
        subjectId: subject.id,
        teacherId: teacher.id,
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "09:00",
      },
    });

    const attendance = await testPrisma.attendance.create({
      data: {
        studentId: student.id,
        lessonId: lesson.id,
        status: "PRESENT",
        markedById: teacher.id,
      },
    });

    const currentUser = await buildCurrentUser(tUser.id);
    const allowed = await canAccessAttendance(currentUser, attendance.id);

    expect(allowed).toBe(true);
  });

  it("TEST-S15: student A CANNOT access student B's attendance", async () => {
    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-S15");
    const term = await createTerm(year.id, "T1-S15");
    const subject = await createSubject("MATH-S15");

    const { user: tUser } = await createUser(ROLES.TEACHER);
    const teacher = await createTeacher(tUser.id);
    const cls = await createClass(year.id, level.id, { name: "S1-A-S15" });
    await createTeacherAssignment(teacher.id, cls.id, year.id, subject.id);

    const { user: sAUser } = await createUser(ROLES.STUDENT);
    const studentA = await createStudent({ userId: sAUser.id });
    await createEnrollment(studentA.id, year.id, cls.id, level.id);

    const { user: sBUser } = await createUser(ROLES.STUDENT);
    const studentB = await createStudent({ userId: sBUser.id });
    await createEnrollment(studentB.id, year.id, cls.id, level.id);

    const tv = await testPrisma.timetableVersion.create({
      data: { academicYearId: year.id, termId: term.id, version: 1 },
    });

    const lesson = await testPrisma.lesson.create({
      data: {
        timetableVersionId: tv.id,
        academicYearId: year.id,
        termId: term.id,
        classId: cls.id,
        subjectId: subject.id,
        teacherId: teacher.id,
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "09:00",
      },
    });

    const attendanceB = await testPrisma.attendance.create({
      data: {
        studentId: studentB.id,
        lessonId: lesson.id,
        status: "PRESENT",
        markedById: teacher.id,
      },
    });

    const currentUser = await buildCurrentUser(sAUser.id);
    const allowed = await canAccessAttendance(currentUser, attendanceB.id);

    expect(allowed).toBe(false);
  });
});

// ============================================================
// SECTION 5 — Invoice / Payment scope
// ============================================================

describe("Invoice and Payment scope", () => {
  it("TEST-S16: parent CAN access own child's invoice", async () => {
    const year = await createAcademicYear("AY-S16");

    const { user: pUser } = await createUser(ROLES.PARENT);
    const parent = await createParent({ userId: pUser.id });

    const { user: sUser } = await createUser(ROLES.STUDENT);
    const student = await createStudent({ userId: sUser.id });
    await linkParentStudent(parent.id, student.id);

    const invoice = await testPrisma.invoice.create({
      data: {
        invoiceNumber: `INV-S16-${Date.now()}`,
        studentId: student.id,
        academicYearId: year.id,
        dueDate: new Date(),
        subtotal: 100000,
        totalAmount: 100000,
        balance: 100000,
      },
    });

    const currentUser = await buildCurrentUser(pUser.id);
    const allowed = await canAccessInvoice(currentUser, invoice.id);

    expect(allowed).toBe(true);
  });

  it("TEST-S17: parent CANNOT access another parent's child's invoice", async () => {
    const year = await createAcademicYear("AY-S17");

    const { user: pAUser } = await createUser(ROLES.PARENT);
    await createParent({ userId: pAUser.id });

    const { user: pBUser } = await createUser(ROLES.PARENT);
    const parentB = await createParent({ userId: pBUser.id });

    const { user: sUser } = await createUser(ROLES.STUDENT);
    const student = await createStudent({ userId: sUser.id });
    await linkParentStudent(parentB.id, student.id);

    const invoice = await testPrisma.invoice.create({
      data: {
        invoiceNumber: `INV-S17-${Date.now()}`,
        studentId: student.id,
        academicYearId: year.id,
        dueDate: new Date(),
        subtotal: 100000,
        totalAmount: 100000,
        balance: 100000,
      },
    });

    const currentUser = await buildCurrentUser(pAUser.id);
    const allowed = await canAccessInvoice(currentUser, invoice.id);

    expect(allowed).toBe(false);
  });

  it("TEST-S18: teacher CANNOT access any invoice", async () => {
    const year = await createAcademicYear("AY-S18");

    const { user: tUser } = await createUser(ROLES.TEACHER);
    await createTeacher(tUser.id);

    const { user: sUser } = await createUser(ROLES.STUDENT);
    const student = await createStudent({ userId: sUser.id });

    const invoice = await testPrisma.invoice.create({
      data: {
        invoiceNumber: `INV-S18-${Date.now()}`,
        studentId: student.id,
        academicYearId: year.id,
        dueDate: new Date(),
        subtotal: 100000,
        totalAmount: 100000,
        balance: 100000,
      },
    });

    const currentUser = await buildCurrentUser(tUser.id);
    const allowed = await canAccessInvoice(currentUser, invoice.id);

    expect(allowed).toBe(false);
  });

  it("TEST-S19: non-existent invoice → false", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canAccessInvoice(currentUser, "nonexistent");
    expect(allowed).toBe(false);
  });
});

// ============================================================
// SECTION 6 — Announcement scope
// ============================================================

describe("Announcement scope", () => {
  it("TEST-S20: ALL-audience announcement is visible to students", async () => {
    const { user: aUser } = await createUser(ROLES.SCHOOL_ADMIN);
    const announcement = await testPrisma.announcement.create({
      data: {
        title: "Test",
        body: "Body",
        audience: "ALL",
        authorId: aUser.id,
        publishedAt: new Date(),
      },
    });

    const { user: sUser } = await createUser(ROLES.STUDENT);
    const currentUser = await buildCurrentUser(sUser.id);
    const allowed = await canAccessAnnouncement(currentUser, announcement.id);

    expect(allowed).toBe(true);
  });

  it("TEST-S21: STUDENTS-audience announcement is NOT visible to parents", async () => {
    const { user: aUser } = await createUser(ROLES.SCHOOL_ADMIN);
    const announcement = await testPrisma.announcement.create({
      data: {
        title: "Students only",
        body: "Body",
        audience: "STUDENTS",
        authorId: aUser.id,
        publishedAt: new Date(),
      },
    });

    const { user: pUser } = await createUser(ROLES.PARENT);
    const currentUser = await buildCurrentUser(pUser.id);
    const allowed = await canAccessAnnouncement(currentUser, announcement.id);

    expect(allowed).toBe(false);
  });

  it("TEST-S22: unpublished announcement visible only to author/admins", async () => {
    const { user: aUser } = await createUser(ROLES.SCHOOL_ADMIN);
    const announcement = await testPrisma.announcement.create({
      data: {
        title: "Draft",
        body: "Not published",
        audience: "ALL",
        authorId: aUser.id,
        publishedAt: null,
      },
    });

    // Admin (author) can see it
    const adminUser = await buildCurrentUser(aUser.id);
    const adminCanSee = await canAccessAnnouncement(
      adminUser,
      announcement.id,
    );
    expect(adminCanSee).toBe(true);

    // Student cannot see it
    const { user: sUser } = await createUser(ROLES.STUDENT);
    const studentUser = await buildCurrentUser(sUser.id);
    const studentCanSee = await canAccessAnnouncement(
      studentUser,
      announcement.id,
    );
    expect(studentCanSee).toBe(false);
  });

  it("TEST-S23: non-existent announcement → false", async () => {
    const { user } = await createUser(ROLES.STUDENT);
    const currentUser = await buildCurrentUser(user.id);

    const allowed = await canAccessAnnouncement(currentUser, "nonexistent");
    expect(allowed).toBe(false);
  });
});

// ============================================================
// SECTION 7 — Report card scope
// ============================================================

describe("Report card scope", () => {
  it("TEST-S24: parent CAN access own child's report card", async () => {
    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-S24");
    const term = await createTerm(year.id, "T1-S24");

    const { user: pUser } = await createUser(ROLES.PARENT);
    const parent = await createParent({ userId: pUser.id });

    const { user: sUser } = await createUser(ROLES.STUDENT);
    const student = await createStudent({ userId: sUser.id });
    await linkParentStudent(parent.id, student.id);

    const cls = await createClass(year.id, level.id, { name: "S1-A-S24" });
    await createEnrollment(student.id, year.id, cls.id, level.id);

    const reportCard = await testPrisma.reportCard.create({
      data: {
        studentId: student.id,
        termId: term.id,
        classId: cls.id,
        academicYearId: year.id,
        status: "PUBLISHED",
      },
    });

    const currentUser = await buildCurrentUser(pUser.id);
    const allowed = await canAccessReportCard(currentUser, reportCard.id);

    expect(allowed).toBe(true);
  });

  it("TEST-S25: parent CANNOT access another child's report card", async () => {
    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-S25");
    const term = await createTerm(year.id, "T1-S25");

    const { user: pAUser } = await createUser(ROLES.PARENT);
    await createParent({ userId: pAUser.id });

    const { user: sUser } = await createUser(ROLES.STUDENT);
    const student = await createStudent({ userId: sUser.id });

    const cls = await createClass(year.id, level.id, { name: "S1-A-S25" });
    await createEnrollment(student.id, year.id, cls.id, level.id);

    const reportCard = await testPrisma.reportCard.create({
      data: {
        studentId: student.id,
        termId: term.id,
        classId: cls.id,
        academicYearId: year.id,
        status: "PUBLISHED",
      },
    });

    const currentUser = await buildCurrentUser(pAUser.id);
    const allowed = await canAccessReportCard(currentUser, reportCard.id);

    expect(allowed).toBe(false);
  });

  it("TEST-S26: student CANNOT access another student's report card", async () => {
    const level = await createEducationLevel("S1", { order: 7 });
    const year = await createAcademicYear("AY-S26");
    const term = await createTerm(year.id, "T1-S26");

    const { user: sAUser } = await createUser(ROLES.STUDENT);
    const studentA = await createStudent({ userId: sAUser.id });
    const cls = await createClass(year.id, level.id, { name: "S1-A-S26" });
    await createEnrollment(studentA.id, year.id, cls.id, level.id);

    const { user: sBUser } = await createUser(ROLES.STUDENT);
    const studentB = await createStudent({ userId: sBUser.id });
    await createEnrollment(studentB.id, year.id, cls.id, level.id);

    const reportCardB = await testPrisma.reportCard.create({
      data: {
        studentId: studentB.id,
        termId: term.id,
        classId: cls.id,
        academicYearId: year.id,
        status: "PUBLISHED",
      },
    });

    const currentUser = await buildCurrentUser(sAUser.id);
    const allowed = await canAccessReportCard(currentUser, reportCardB.id);

    expect(allowed).toBe(false);
  });
});