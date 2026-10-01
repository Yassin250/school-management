// ============================================================
// Attendance Service Tests
// ============================================================

import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { testPrisma, resetDatabase, resetUserData } from "../setup";
import {
  createUser,
  createStudent,
  createTeacher,
  createEducationLevel,
  createAcademicYear,
  createTerm,
  createClass,
  createSubject,
  createEnrollment,
  createTeacherAssignment,
} from "../factories";
import { ROLES } from "../../src/lib/permissions/constants";
import type { CurrentUser } from "../../src/lib/auth/session";
import { saveAttendance } from "../../src/lib/services/attendance/attendance";
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
// Fixture — a full teaching context
// ------------------------------------------------------------

async function buildTeachingFixture() {
  const level = await createEducationLevel("S1", { order: 7 });
  const year = await createAcademicYear(`AY-ATT-${Date.now()}`);
  const term = await createTerm(year.id, `T-ATT-${Date.now()}`);
  const subject = await createSubject(`SUB-ATT-${Date.now()}`);

  const { user: tUser } = await createUser(ROLES.TEACHER);
  const teacher = await createTeacher(tUser.id);
  const actor = await buildCurrentUser(tUser.id);

  const cls = await createClass(year.id, level.id, {
    name: `S1A-ATT-${Date.now()}`,
  });
  await createTeacherAssignment(teacher.id, cls.id, year.id, subject.id);

  const { user: s1User } = await createUser(ROLES.STUDENT);
  const student1 = await createStudent({ userId: s1User.id });
  await createEnrollment(student1.id, year.id, cls.id, level.id);

  const { user: s2User } = await createUser(ROLES.STUDENT);
  const student2 = await createStudent({ userId: s2User.id });
  await createEnrollment(student2.id, year.id, cls.id, level.id);

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

  return {
    actor,
    teacherId: teacher.id,
    student1Id: student1.id,
    student2Id: student2.id,
    lessonId: lesson.id,
    classId: cls.id,
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
// saveAttendance
// ============================================================

describe("saveAttendance", () => {
  it("TEST-ATT01: teacher can mark attendance for their lesson", async () => {
    const f = await buildTeachingFixture();

    const result = await saveAttendance(f.actor, {
      lessonId: f.lessonId,
      records: [
        { studentId: f.student1Id, status: "PRESENT" },
        { studentId: f.student2Id, status: "ABSENT" },
      ],
    });

    expect(result.created).toBe(2);
    expect(result.updated).toBe(0);
    expect(result.total).toBe(2);
  });

  it("TEST-ATT02: attendance cannot be marked without permission", async () => {
    const f = await buildTeachingFixture();

    const { user: studentUser } = await createUser(ROLES.STUDENT);
    const studentActor = await buildCurrentUser(studentUser.id);

    await expect(
      saveAttendance(studentActor, {
        lessonId: f.lessonId,
        records: [{ studentId: f.student1Id, status: "PRESENT" }],
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("TEST-ATT03: rejects an empty records list", async () => {
    const f = await buildTeachingFixture();

    await expect(
      saveAttendance(f.actor, {
        lessonId: f.lessonId,
        records: [],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-ATT04: rejects a non-existent lesson", async () => {
    const f = await buildTeachingFixture();

    await expect(
      saveAttendance(f.actor, {
        lessonId: "nonexistent",
        records: [{ studentId: f.student1Id, status: "PRESENT" }],
      }),
    ).rejects.toThrow();
  });

  it("TEST-ATT05: re-marking the same student updates, doesn't duplicate", async () => {
    const f = await buildTeachingFixture();

    await saveAttendance(f.actor, {
      lessonId: f.lessonId,
      records: [{ studentId: f.student1Id, status: "PRESENT" }],
    });

    const result2 = await saveAttendance(f.actor, {
      lessonId: f.lessonId,
      records: [{ studentId: f.student1Id, status: "ABSENT" }],
    });

    expect(result2.created).toBe(0);
    expect(result2.updated).toBe(1);

    const records = await testPrisma.attendance.findMany({
      where: { lessonId: f.lessonId, studentId: f.student1Id },
    });
    expect(records.length).toBe(1);
    expect(records[0].status).toBe("ABSENT");
  });

  it("TEST-ATT06: writes an audit log", async () => {
    const f = await buildTeachingFixture();

    await saveAttendance(f.actor, {
      lessonId: f.lessonId,
      records: [
        { studentId: f.student1Id, status: "PRESENT" },
        { studentId: f.student2Id, status: "LATE" },
      ],
    });

    const logs = await testPrisma.auditLog.findMany({
      where: { entity: "Lesson", action: "ATTENDANCE_MARKED" },
    });

    expect(logs.length).toBe(1);
    expect(logs[0].actorId).toBe(f.actor.id);
  });

  it("TEST-ATT07: rejects students not enrolled in the class", async () => {
    const f = await buildTeachingFixture();

    const { user: outsiderUser } = await createUser(ROLES.STUDENT);
    const outsider = await createStudent({ userId: outsiderUser.id });
    // NOT enrolled in this class

    await expect(
      saveAttendance(f.actor, {
        lessonId: f.lessonId,
        records: [{ studentId: outsider.id, status: "PRESENT" }],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-ATT08: supports all four statuses", async () => {
    const f = await buildTeachingFixture();

    await saveAttendance(f.actor, {
      lessonId: f.lessonId,
      records: [
        { studentId: f.student1Id, status: "EXCUSED" },
        { studentId: f.student2Id, status: "LATE" },
      ],
    });

    const records = await testPrisma.attendance.findMany({
      where: { lessonId: f.lessonId },
      orderBy: { studentId: "asc" },
    });

    const statuses = records.map((r) => r.status).sort();
    expect(statuses).toEqual(["EXCUSED", "LATE"]);
  });
});