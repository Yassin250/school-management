// ============================================================
// Grade Results Service Tests
// ============================================================
// Verifies mark entry, validation, and that bulk mark changes
// record both previous and new values in the audit trail.
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
  createAssessment,
  createAssessmentResult,
} from "../factories";
import { ROLES } from "../../src/lib/permissions/constants";
import type { CurrentUser } from "../../src/lib/auth/session";
import { enterResult, enterResultsBulk } from "../../src/lib/services/grades/results";
import { ForbiddenError, ValidationError } from "../../src/lib/errors";

// ------------------------------------------------------------
// Build CurrentUser from DB
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
// Fixture
// ------------------------------------------------------------

interface Fixture {
  teacher: { id: string; actor: CurrentUser };
  otherTeacher: { id: string; actor: CurrentUser };
  student1: { id: string };
  student2: { id: string };
  year: { id: string };
  term: { id: string };
  cls: { id: string };
  subject: { id: string };
}

async function buildFixture(): Promise<Fixture> {
  const level = await createEducationLevel("S1", { order: 7 });
  const year = await createAcademicYear(`AY-${Date.now()}`);
  const term = await createTerm(year.id, `T-${Date.now()}`);
  const subject = await createSubject(`MATH-${Date.now()}`);

  const { user: tUser } = await createUser(ROLES.TEACHER);
  const teacher = await createTeacher(tUser.id);
  const teacherActor = await buildCurrentUser(tUser.id);

  const { user: oTUser } = await createUser(ROLES.TEACHER);
  const otherTeacher = await createTeacher(oTUser.id);
  const otherTeacherActor = await buildCurrentUser(oTUser.id);

  const cls = await createClass(year.id, level.id, {
    name: `S1A-${Date.now()}`,
  });
  await createTeacherAssignment(teacher.id, cls.id, year.id, subject.id);

  const { user: s1User } = await createUser(ROLES.STUDENT);
  const student1 = await createStudent({ userId: s1User.id });
  await createEnrollment(student1.id, year.id, cls.id, level.id);

  const { user: s2User } = await createUser(ROLES.STUDENT);
  const student2 = await createStudent({ userId: s2User.id });
  await createEnrollment(student2.id, year.id, cls.id, level.id);

  return {
    teacher: { id: teacher.id, actor: teacherActor },
    otherTeacher: { id: otherTeacher.id, actor: otherTeacherActor },
    student1: { id: student1.id },
    student2: { id: student2.id },
    year: { id: year.id },
    term: { id: term.id },
    cls: { id: cls.id },
    subject: { id: subject.id },
  };
}

async function createDraftAssessment(f: Fixture) {
  return createAssessment(
    f.teacher.id,
    f.cls.id,
    f.term.id,
    f.subject.id,
    { maxScore: 100 },
  );
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
// 1. Validation
// ============================================================

describe("Result validation", () => {
  it("TEST-R01: teacher cannot enter marks for an out-of-scope assessment", async () => {
    const f = await buildFixture();
    const assessment = await createDraftAssessment(f);

    await expect(
      enterResultsBulk({
        assessmentId: assessment.id,
        results: [
          { studentId: f.student1.id, score: 80, isAbsent: false },
        ],
        actor: f.otherTeacher.actor,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("TEST-R02: a score above maxScore is rejected", async () => {
    const f = await buildFixture();
    const assessment = await createDraftAssessment(f);

    await expect(
      enterResultsBulk({
        assessmentId: assessment.id,
        results: [
          { studentId: f.student1.id, score: 150, isAbsent: false },
        ],
        actor: f.teacher.actor,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-R03: an absent student with a score is rejected", async () => {
    const f = await buildFixture();
    const assessment = await createDraftAssessment(f);

    await expect(
      enterResultsBulk({
        assessmentId: assessment.id,
        results: [
          { studentId: f.student1.id, score: 80, isAbsent: true },
        ],
        actor: f.teacher.actor,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-R04: a student from another class is rejected", async () => {
    const f = await buildFixture();
    const assessment = await createDraftAssessment(f);

    const otherLevel = await createEducationLevel("S2", { order: 8 });
    const otherClass = await createClass(f.year.id, otherLevel.id, {
      name: `S2A-${Date.now()}`,
    });
    const { user: outsiderUser } = await createUser(ROLES.STUDENT);
    const outsider = await createStudent({ userId: outsiderUser.id });
    await createEnrollment(outsider.id, f.year.id, otherClass.id, otherLevel.id);

    await expect(
      enterResultsBulk({
        assessmentId: assessment.id,
        results: [
          { studentId: outsider.id, score: 80, isAbsent: false },
        ],
        actor: f.teacher.actor,
      }),
    ).rejects.toThrow(ValidationError);
  });
});

// ============================================================
// 2. Bulk audit history
// ============================================================

describe("Bulk mark entry audit history", () => {
  it("TEST-R05: newly created results record a null previous value", async () => {
    const f = await buildFixture();
    const assessment = await createDraftAssessment(f);

    await enterResultsBulk({
      assessmentId: assessment.id,
      results: [
        { studentId: f.student1.id, score: 80, isAbsent: false },
        { studentId: f.student2.id, score: 60, isAbsent: false },
      ],
      actor: f.teacher.actor,
    });

    const logs = await testPrisma.auditLog.findMany({
      where: { action: "GRADE_UPDATED", entityId: assessment.id },
    });
    expect(logs).toHaveLength(1);

    const newValue = logs[0].newValue as {
      count: number;
      submittedCount: number;
      changes: Array<{
        studentId: string;
        previous: unknown;
        current: { score: string | null; isAbsent: boolean; note: string | null };
      }>;
    };

    expect(newValue.count).toBe(2);
    expect(newValue.submittedCount).toBe(2);
    expect(newValue.changes).toHaveLength(2);

    const change1 = newValue.changes.find(
      (c) => c.studentId === f.student1.id,
    );
    expect(change1?.previous).toBeNull();
    expect(change1?.current).toEqual({
      score: "80",
      isAbsent: false,
      note: null,
    });
  });

  it("TEST-R06: changed marks record both previous and new values", async () => {
    const f = await buildFixture();
    const assessment = await createDraftAssessment(f);

    await enterResultsBulk({
      assessmentId: assessment.id,
      results: [
        { studentId: f.student1.id, score: 80, isAbsent: false },
        { studentId: f.student2.id, score: 60, isAbsent: false },
      ],
      actor: f.teacher.actor,
    });

    await enterResultsBulk({
      assessmentId: assessment.id,
      results: [
        { studentId: f.student1.id, score: 92, isAbsent: false },
        { studentId: f.student2.id, score: 60, isAbsent: false },
      ],
      actor: f.teacher.actor,
    });

    const logs = await testPrisma.auditLog.findMany({
      where: { action: "GRADE_UPDATED", entityId: assessment.id },
      orderBy: { createdAt: "asc" },
    });
    expect(logs).toHaveLength(2);

    const second = logs[1].newValue as {
      count: number;
      submittedCount: number;
      changes: Array<{
        studentId: string;
        previous: { score: string | null; isAbsent: boolean; note: string | null } | null;
        current: { score: string | null; isAbsent: boolean; note: string | null };
      }>;
    };

    // Only student1 actually changed; student2 is not audit noise.
    expect(second.count).toBe(1);
    expect(second.submittedCount).toBe(2);
    expect(second.changes).toHaveLength(1);

    const change = second.changes[0];
    expect(change.studentId).toBe(f.student1.id);
    expect(change.previous).toEqual({
      score: "80",
      isAbsent: false,
      note: null,
    });
    expect(change.current).toEqual({
      score: "92",
      isAbsent: false,
      note: null,
    });
  });

  it("TEST-R07: an unchanged re-save writes no audit entry", async () => {
    const f = await buildFixture();
    const assessment = await createDraftAssessment(f);

    const rows = [
      { studentId: f.student1.id, score: 80, isAbsent: false },
    ];

    await enterResultsBulk({
      assessmentId: assessment.id,
      results: rows,
      actor: f.teacher.actor,
    });
    await enterResultsBulk({
      assessmentId: assessment.id,
      results: rows,
      actor: f.teacher.actor,
    });

    const logs = await testPrisma.auditLog.findMany({
      where: { action: "GRADE_UPDATED", entityId: assessment.id },
    });
    expect(logs).toHaveLength(1);
  });

  it("TEST-R08: marking a student absent records the transition", async () => {
    const f = await buildFixture();
    const assessment = await createDraftAssessment(f);

    await enterResultsBulk({
      assessmentId: assessment.id,
      results: [
        { studentId: f.student1.id, score: 80, isAbsent: false },
      ],
      actor: f.teacher.actor,
    });

    await enterResultsBulk({
      assessmentId: assessment.id,
      results: [
        { studentId: f.student1.id, score: null, isAbsent: true },
      ],
      actor: f.teacher.actor,
    });

    const logs = await testPrisma.auditLog.findMany({
      where: { action: "GRADE_UPDATED", entityId: assessment.id },
      orderBy: { createdAt: "asc" },
    });
    const change = (logs[1].newValue as { changes: Array<{
      previous: { score: string | null; isAbsent: boolean } | null;
      current: { score: string | null; isAbsent: boolean };
    }> }).changes[0];

    expect(change.previous).toMatchObject({ score: "80", isAbsent: false });
    expect(change.current).toMatchObject({ score: null, isAbsent: true });
  });

  it("TEST-R09: a note-only change is still audited", async () => {
    const f = await buildFixture();
    const assessment = await createDraftAssessment(f);

    await enterResultsBulk({
      assessmentId: assessment.id,
      results: [
        { studentId: f.student1.id, score: 80, isAbsent: false },
      ],
      actor: f.teacher.actor,
    });

    await enterResultsBulk({
      assessmentId: assessment.id,
      results: [
        {
          studentId: f.student1.id,
          score: 80,
          isAbsent: false,
          note: "Excellent effort",
        },
      ],
      actor: f.teacher.actor,
    });

    const logs = await testPrisma.auditLog.findMany({
      where: { action: "GRADE_UPDATED", entityId: assessment.id },
      orderBy: { createdAt: "asc" },
    });
    expect(logs).toHaveLength(2);

    const change = (logs[1].newValue as { changes: Array<{
      previous: { note: string | null } | null;
      current: { note: string | null };
    }> }).changes[0];

    expect(change.previous?.note).toBeNull();
    expect(change.current.note).toBe("Excellent effort");
  });

  it("TEST-R10: audit does not expose unrelated personal information", async () => {
    const f = await buildFixture();
    const assessment = await createDraftAssessment(f);

    await enterResultsBulk({
      assessmentId: assessment.id,
      results: [
        { studentId: f.student1.id, score: 80, isAbsent: false },
      ],
      actor: f.teacher.actor,
    });

    const log = await testPrisma.auditLog.findFirst({
      where: { action: "GRADE_UPDATED", entityId: assessment.id },
    });

    const serialized = JSON.stringify(log);
    const student = await testPrisma.student.findUnique({
      where: { id: f.student1.id },
    });

    // Only the identifiers and grade data needed to trace the change.
    expect(serialized).not.toContain(student!.firstName);
    expect(serialized).not.toContain(student!.studentCode);
    expect(serialized).not.toContain(f.teacher.actor.email);
  });
});

// ============================================================
// 3. Single-result entry
// ============================================================

describe("Single result entry audit", () => {
  it("TEST-R11: updating a single mark records previous and new values", async () => {
    const f = await buildFixture();
    const assessment = await createDraftAssessment(f);

    await createAssessmentResult(
      assessment.id,
      f.student1.id,
      f.teacher.actor.id,
      { score: 55 },
    );

    await enterResult({
      assessmentId: assessment.id,
      studentId: f.student1.id,
      score: 75,
      isAbsent: false,
      actor: f.teacher.actor,
    });

    const log = await testPrisma.auditLog.findFirst({
      where: { action: "GRADE_UPDATED", entity: "AssessmentResult" },
    });

    expect(log?.previousValue).toMatchObject({ score: "55", isAbsent: false });
    expect(log?.newValue).toMatchObject({ score: "75", isAbsent: false });
  });
});
