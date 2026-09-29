// ============================================================
// Report Card Service Tests
// ============================================================
// Verifies the gate + generation + approve + publish workflow
// and the regeneration flag.
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
import {
  checkReportCardGate,
  generateReportCard,
  approveReportCard,
  publishReportCard,
  markReportCardForRegeneration,
} from "../../src/lib/services/grades/report-card";
import {
  ConflictError,
  ForbiddenError,
} from "../../src/lib/errors";

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
// Fixture — student in a class with one approved assessment
// ------------------------------------------------------------

interface Fixture {
  teacher: { id: string; actor: CurrentUser };
  principal: { id: string; actor: CurrentUser };
  schoolAdmin: { id: string; actor: CurrentUser };
  student: { id: string };
  level: { id: string };
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

  const { user: pUser } = await createUser(ROLES.PRINCIPAL);
  const principalActor = await buildCurrentUser(pUser.id);

  const { user: aUser } = await createUser(ROLES.SCHOOL_ADMIN);
  const adminActor = await buildCurrentUser(aUser.id);

  const cls = await createClass(year.id, level.id, {
    name: `S1A-${Date.now()}`,
  });
  await createTeacherAssignment(teacher.id, cls.id, year.id, subject.id);

  const { user: sUser } = await createUser(ROLES.STUDENT);
  const student = await createStudent({ userId: sUser.id });
  await createEnrollment(student.id, year.id, cls.id, level.id);

  return {
    teacher: { id: teacher.id, actor: teacherActor },
    principal: { id: pUser.id, actor: principalActor },
    schoolAdmin: { id: aUser.id, actor: adminActor },
    student: { id: student.id },
    level: { id: level.id },
    year: { id: year.id },
    term: { id: term.id },
    cls: { id: cls.id },
    subject: { id: subject.id },
  };
}

// Helper — create one assessment with a given status and score
async function createAssessmentWithStatus(
  f: Fixture,
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "RETURNED"
    | "LOCKED"
    | "CORRECTION_PENDING",
  score = 80,
) {
  const assessment = await createAssessment(
    f.teacher.id,
    f.cls.id,
    f.term.id,
    f.subject.id,
    { status },
  );
  await createAssessmentResult(
    assessment.id,
    f.student.id,
    f.teacher.actor.id,
    { score },
  );
  return assessment;
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
// 1. Gate blocking
// ============================================================

describe("Report card gate — blocking statuses", () => {
  it("TEST-RC01: gate rejects when assessment is DRAFT", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "DRAFT");

    const gate = await checkReportCardGate(f.student.id, f.term.id);
    expect(gate.canGenerate).toBe(false);
    expect(gate.blockingAssessments).toHaveLength(1);
    expect(gate.blockingAssessments[0].status).toBe("DRAFT");
  });

  it("TEST-RC02: gate rejects when assessment is SUBMITTED", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "SUBMITTED");

    const gate = await checkReportCardGate(f.student.id, f.term.id);
    expect(gate.canGenerate).toBe(false);
  });

  it("TEST-RC03: gate rejects when assessment is UNDER_REVIEW", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "UNDER_REVIEW");

    const gate = await checkReportCardGate(f.student.id, f.term.id);
    expect(gate.canGenerate).toBe(false);
  });

  it("TEST-RC04: gate rejects when assessment is RETURNED", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "RETURNED");

    const gate = await checkReportCardGate(f.student.id, f.term.id);
    expect(gate.canGenerate).toBe(false);
  });

  it("TEST-RC05: gate rejects when assessment is CORRECTION_PENDING", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "CORRECTION_PENDING");

    const gate = await checkReportCardGate(f.student.id, f.term.id);
    expect(gate.canGenerate).toBe(false);
  });
});

// ============================================================
// 2. Gate allowed
// ============================================================

describe("Report card gate — allowed statuses", () => {
  it("TEST-RC06: gate allows when all assessments are APPROVED", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "APPROVED");

    const gate = await checkReportCardGate(f.student.id, f.term.id);
    expect(gate.canGenerate).toBe(true);
    expect(gate.blockingAssessments).toHaveLength(0);
  });

  it("TEST-RC07: gate allows when all assessments are LOCKED", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "LOCKED");

    const gate = await checkReportCardGate(f.student.id, f.term.id);
    expect(gate.canGenerate).toBe(true);
  });

  it("TEST-RC08: gate mixes approved + locked without blocking", async () => {
    const f = await buildFixture();
    const subject2 = await createSubject(`ENG-${Date.now()}`);
    await createTeacherAssignment(f.teacher.id, f.cls.id, f.year.id, subject2.id);

    await createAssessmentWithStatus(f, "APPROVED", 85);
    const a2 = await createAssessment(
      f.teacher.id,
      f.cls.id,
      f.term.id,
      subject2.id,
      { status: "LOCKED" },
    );
    await createAssessmentResult(a2.id, f.student.id, f.teacher.actor.id, {
      score: 75,
    });

    const gate = await checkReportCardGate(f.student.id, f.term.id);
    expect(gate.canGenerate).toBe(true);
  });
});

// ============================================================
// 3. Generation
// ============================================================

describe("Report card generation", () => {
  it("TEST-RC09: generate fails when gate blocks", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "DRAFT");

    await expect(
      generateReportCard({
        studentId: f.student.id,
        termId: f.term.id,
        actor: f.schoolAdmin.actor,
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("TEST-RC10: generate succeeds when all approved", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "APPROVED", 80);

    const rc = await generateReportCard({
      studentId: f.student.id,
      termId: f.term.id,
      actor: f.schoolAdmin.actor,
    });

    expect(rc.status).toBe("GENERATED");
    expect(rc.studentId).toBe(f.student.id);
    expect(rc.averageScore?.toString()).toBe("80");
  });

  it("TEST-RC11: generate computes average across multiple subjects", async () => {
    const f = await buildFixture();
    const subject2 = await createSubject(`ENG-${Date.now()}`);
    await createTeacherAssignment(f.teacher.id, f.cls.id, f.year.id, subject2.id);

    // Subject 1: score 80 → percentage 80
    await createAssessmentWithStatus(f, "APPROVED", 80);

    // Subject 2: score 60 → percentage 60
    const a2 = await createAssessment(
      f.teacher.id,
      f.cls.id,
      f.term.id,
      subject2.id,
      { status: "APPROVED" },
    );
    await createAssessmentResult(a2.id, f.student.id, f.teacher.actor.id, {
      score: 60,
    });

    const rc = await generateReportCard({
      studentId: f.student.id,
      termId: f.term.id,
      actor: f.schoolAdmin.actor,
    });

    // Average of 80 and 60 = 70
    expect(rc.averageScore?.toString()).toBe("70");
  });

  it("TEST-RC12: teacher cannot generate report card (no permission)", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "APPROVED");

    await expect(
      generateReportCard({
        studentId: f.student.id,
        termId: f.term.id,
        actor: f.teacher.actor,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("TEST-RC13: generate creates one ReportCardItem per subject", async () => {
    const f = await buildFixture();
    const subject2 = await createSubject(`ENG-${Date.now()}`);
    await createTeacherAssignment(f.teacher.id, f.cls.id, f.year.id, subject2.id);

    await createAssessmentWithStatus(f, "APPROVED", 80);
    const a2 = await createAssessment(
      f.teacher.id,
      f.cls.id,
      f.term.id,
      subject2.id,
      { status: "APPROVED" },
    );
    await createAssessmentResult(a2.id, f.student.id, f.teacher.actor.id, {
      score: 60,
    });

    const rc = await generateReportCard({
      studentId: f.student.id,
      termId: f.term.id,
      actor: f.schoolAdmin.actor,
    });

    const items = await testPrisma.reportCardItem.findMany({
      where: { reportCardId: rc.id },
    });
    expect(items).toHaveLength(2);
  });
});

// ============================================================
// 4. Approve / publish
// ============================================================

describe("Report card approve / publish", () => {
  it("TEST-RC14: approve transitions GENERATED → APPROVED", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "APPROVED");

    const rc = await generateReportCard({
      studentId: f.student.id,
      termId: f.term.id,
      actor: f.schoolAdmin.actor,
    });

    const approved = await approveReportCard(rc.id, f.principal.actor);
    expect(approved.status).toBe("APPROVED");
    expect(approved.approvedById).toBe(f.principal.id);
  });

  it("TEST-RC15: cannot approve a DRAFT report card", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "APPROVED");

    const rc = await generateReportCard({
      studentId: f.student.id,
      termId: f.term.id,
      actor: f.schoolAdmin.actor,
    });

    // Manually set back to DRAFT
    await testPrisma.reportCard.update({
      where: { id: rc.id },
      data: { status: "DRAFT" },
    });

    await expect(
      approveReportCard(rc.id, f.principal.actor),
    ).rejects.toThrow(ConflictError);
  });

  it("TEST-RC16: publish transitions APPROVED → PUBLISHED", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "APPROVED");

    const rc = await generateReportCard({
      studentId: f.student.id,
      termId: f.term.id,
      actor: f.schoolAdmin.actor,
    });
    await approveReportCard(rc.id, f.principal.actor);

    const published = await publishReportCard(rc.id, f.principal.actor);
    expect(published.status).toBe("PUBLISHED");
    expect(published.publishedAt).toBeTruthy();
  });

  it("TEST-RC17: cannot publish a GENERATED (unapproved) report card", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "APPROVED");

    const rc = await generateReportCard({
      studentId: f.student.id,
      termId: f.term.id,
      actor: f.schoolAdmin.actor,
    });

    await expect(
      publishReportCard(rc.id, f.principal.actor),
    ).rejects.toThrow(ConflictError);
  });
});

// ============================================================
// 5. Regeneration
// ============================================================

describe("Report card regeneration", () => {
  it("TEST-RC18: regenerate on GENERATED report card replaces items", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "APPROVED", 80);

    const rc = await generateReportCard({
      studentId: f.student.id,
      termId: f.term.id,
      actor: f.schoolAdmin.actor,
    });

    const itemsBefore = await testPrisma.reportCardItem.findMany({
      where: { reportCardId: rc.id },
    });
    expect(itemsBefore).toHaveLength(1);

    // Change the assessment score to 95
    await testPrisma.assessmentResult.updateMany({
      where: { studentId: f.student.id },
      data: { score: 95 },
    });

    const rc2 = await generateReportCard({
      studentId: f.student.id,
      termId: f.term.id,
      actor: f.schoolAdmin.actor,
    });

    expect(rc2.id).toBe(rc.id); // same row, updated
    expect(rc2.averageScore?.toString()).toBe("95");
  });

  it("TEST-RC19: cannot regenerate an APPROVED report card", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "APPROVED", 80);

    const rc = await generateReportCard({
      studentId: f.student.id,
      termId: f.term.id,
      actor: f.schoolAdmin.actor,
    });
    await approveReportCard(rc.id, f.principal.actor);

    await expect(
      generateReportCard({
        studentId: f.student.id,
        termId: f.term.id,
        actor: f.schoolAdmin.actor,
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("TEST-RC20: markReportCardForRegeneration sets the flag on PUBLISHED", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "APPROVED");

    const rc = await generateReportCard({
      studentId: f.student.id,
      termId: f.term.id,
      actor: f.schoolAdmin.actor,
    });
    await approveReportCard(rc.id, f.principal.actor);
    await publishReportCard(rc.id, f.principal.actor);

    await markReportCardForRegeneration(
      f.student.id,
      f.term.id,
      "Assessment correction approved",
    );

    const updated = await testPrisma.reportCard.findUnique({
      where: { id: rc.id },
    });
    expect(updated?.needsRegeneration).toBe(true);
    expect(updated?.regenerationReason).toBe(
      "Assessment correction approved",
    );
  });

  it("TEST-RC21: markReportCardForRegeneration is a no-op on DRAFT", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "APPROVED");

    const rc = await generateReportCard({
      studentId: f.student.id,
      termId: f.term.id,
      actor: f.schoolAdmin.actor,
    });
    // rc.status is GENERATED, not APPROVED/PUBLISHED → no-op

    await markReportCardForRegeneration(
      f.student.id,
      f.term.id,
      "Should not apply",
    );

    const updated = await testPrisma.reportCard.findUnique({
      where: { id: rc.id },
    });
    expect(updated?.needsRegeneration).toBe(false);
  });

  it("TEST-RC22: markReportCardForRegeneration silently no-ops when no report card exists", async () => {
    const f = await buildFixture();
    await createAssessmentWithStatus(f, "APPROVED");

    // No report card generated yet
    await expect(
      markReportCardForRegeneration(f.student.id, f.term.id, "Any reason"),
    ).resolves.toBeUndefined();
  });
});