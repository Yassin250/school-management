// ============================================================
// Grade Workflow State Machine Tests
// ============================================================
// Verifies every transition in src/lib/services/grades/workflow.ts
// against docs/grade-workflow.md §24.
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
  transitionAssessment,
  submitAssessment,
  startReview,
  approveAssessment,
  returnAssessment,
  reopenReturnedAssessment,
  requestCorrection,
  authorizeCorrection,
  cancelCorrection,
  lockAssessment,
  requestPostLockCorrection,
} from "../../src/lib/services/grades/workflow";
import {
  ConflictError,
  ForbiddenError,
  ValidationError,
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
// Fixture helper — build a class with a teacher, students, and assessment
// ------------------------------------------------------------

interface WorkflowFixture {
  teacher: { id: string; actor: CurrentUser };
  principal: { id: string; actor: CurrentUser };
  schoolAdmin: { id: string; actor: CurrentUser };
  otherTeacher: { id: string; actor: CurrentUser };
  student1: { id: string; userId: string };
  student2: { id: string; userId: string };
  level: { id: string };
  year: { id: string };
  term: { id: string };
  cls: { id: string };
  subject: { id: string };
  assessment: { id: string };
}

async function buildFixture(): Promise<WorkflowFixture> {
  const level = await createEducationLevel("S1", { order: 7 });
  const year = await createAcademicYear(`AY-${Date.now()}`);
  const term = await createTerm(year.id, `T-${Date.now()}`);
  const subject = await createSubject(`MATH-${Date.now()}`);

  // Teacher
  const { user: tUser } = await createUser(ROLES.TEACHER);
  const teacher = await createTeacher(tUser.id);
  const teacherActor = await buildCurrentUser(tUser.id);

  // Other teacher (for scope tests)
  const { user: otherTUser } = await createUser(ROLES.TEACHER);
  const otherTeacher = await createTeacher(otherTUser.id);
  const otherTeacherActor = await buildCurrentUser(otherTUser.id);

  // Principal
  const { user: pUser } = await createUser(ROLES.PRINCIPAL);
  const principalActor = await buildCurrentUser(pUser.id);

  // School admin (has grade approval per RBAC matrix)
  const { user: aUser } = await createUser(ROLES.SCHOOL_ADMIN);
  const adminActor = await buildCurrentUser(aUser.id);

  // Class
  const cls = await createClass(year.id, level.id, {
    name: `S1A-${Date.now()}`,
  });
  await createTeacherAssignment(teacher.id, cls.id, year.id, subject.id);

  // Students
  const { user: s1User } = await createUser(ROLES.STUDENT);
  const student1 = await createStudent({ userId: s1User.id });
  await createEnrollment(student1.id, year.id, cls.id, level.id);

  const { user: s2User } = await createUser(ROLES.STUDENT);
  const student2 = await createStudent({ userId: s2User.id });
  await createEnrollment(student2.id, year.id, cls.id, level.id);

  // Assessment (DRAFT)
  const assessment = await createAssessment(
    teacher.id,
    cls.id,
    term.id,
    subject.id,
  );

  return {
    teacher: { id: teacher.id, actor: teacherActor },
    principal: { id: pUser.id, actor: principalActor },
    schoolAdmin: { id: aUser.id, actor: adminActor },
    otherTeacher: { id: otherTeacher.id, actor: otherTeacherActor },
    student1: { id: student1.id, userId: s1User.id },
    student2: { id: student2.id, userId: s2User.id },
    level: { id: level.id },
    year: { id: year.id },
    term: { id: term.id },
    cls: { id: cls.id },
    subject: { id: subject.id },
    assessment: { id: assessment.id },
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
// 1. State initialization
// ============================================================

describe("State initialization", () => {
  it("TEST-W01: new assessment starts as DRAFT", async () => {
    const f = await buildFixture();
    const assessment = await testPrisma.assessment.findUnique({
      where: { id: f.assessment.id },
    });
    expect(assessment?.status).toBe("DRAFT");
  });
});

// ============================================================
// 2. Submission
// ============================================================

describe("Submission (DRAFT → SUBMITTED)", () => {
  it("TEST-W02: teacher can submit a valid DRAFT assessment", async () => {
    const f = await buildFixture();

    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });

    const result = await submitAssessment(f.assessment.id, f.teacher.actor);
    expect(result.status).toBe("SUBMITTED");
    expect(result.submittedAt).toBeTruthy();
  });

  it("TEST-W03: teacher cannot submit with no results", async () => {
    const f = await buildFixture();

    await expect(
      submitAssessment(f.assessment.id, f.teacher.actor),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-W04: teacher cannot submit with missing student result", async () => {
    const f = await buildFixture();

    // Only student1 has a result; student2 is missing
    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });

    await expect(
      submitAssessment(f.assessment.id, f.teacher.actor),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-W05: teacher cannot submit with out-of-range score", async () => {
    const f = await buildFixture();

    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 150, // max is 100
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });

    await expect(
      submitAssessment(f.assessment.id, f.teacher.actor),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-W06: teacher cannot submit an assessment outside their scope", async () => {
    const f = await buildFixture();

    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });

    await expect(
      submitAssessment(f.assessment.id, f.otherTeacher.actor),
    ).rejects.toThrow(ForbiddenError);
  });

  it("TEST-W07: SUBMITTED assessment cannot be edited (submit again fails)", async () => {
    const f = await buildFixture();
    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });

    await submitAssessment(f.assessment.id, f.teacher.actor);

    await expect(
      submitAssessment(f.assessment.id, f.teacher.actor),
    ).rejects.toThrow(ConflictError);
  });
});

// ============================================================
// 3. Review
// ============================================================

describe("Review (SUBMITTED → UNDER_REVIEW)", () => {
  it("TEST-W08: authorized reviewer can start review", async () => {
    const f = await buildFixture();
    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });
    await submitAssessment(f.assessment.id, f.teacher.actor);

    const result = await startReview(f.assessment.id, f.principal.actor);
    expect(result.status).toBe("UNDER_REVIEW");
    expect(result.reviewedAt).toBeTruthy();
    expect(result.reviewedById).toBe(f.principal.id);
  });

  it("TEST-W09: teacher cannot start review (no grades.review)", async () => {
    const f = await buildFixture();
    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });
    await submitAssessment(f.assessment.id, f.teacher.actor);

    await expect(
      startReview(f.assessment.id, f.teacher.actor),
    ).rejects.toThrow(ForbiddenError);
  });

  it("TEST-W10: reviewer cannot start review on a DRAFT assessment", async () => {
    const f = await buildFixture();
    await expect(
      startReview(f.assessment.id, f.principal.actor),
    ).rejects.toThrow(ConflictError);
  });
});

// ============================================================
// 4. Approval
// ============================================================

describe("Approval (UNDER_REVIEW → APPROVED)", () => {
  it("TEST-W11: principal can approve a valid assessment", async () => {
    const f = await buildFixture();
    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });
    await submitAssessment(f.assessment.id, f.teacher.actor);
    await startReview(f.assessment.id, f.principal.actor);

    const result = await approveAssessment(f.assessment.id, f.principal.actor);
    expect(result.status).toBe("APPROVED");
    expect(result.approvedAt).toBeTruthy();
    expect(result.approvedById).toBe(f.principal.id);
  });

  it("TEST-W12: teacher cannot approve (no grades.approve)", async () => {
    const f = await buildFixture();
    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });
    await submitAssessment(f.assessment.id, f.teacher.actor);
    await startReview(f.assessment.id, f.principal.actor);

    await expect(
      approveAssessment(f.assessment.id, f.teacher.actor),
    ).rejects.toThrow(ForbiddenError);
  });

  it("TEST-W13: cannot approve a DRAFT assessment directly", async () => {
    const f = await buildFixture();
    await expect(
      approveAssessment(f.assessment.id, f.principal.actor),
    ).rejects.toThrow(ConflictError);
  });
});

// ============================================================
// 5. Return
// ============================================================

describe("Return (UNDER_REVIEW → RETURNED)", () => {
  it("TEST-W14: reviewer can return with a reason", async () => {
    const f = await buildFixture();
    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });
    await submitAssessment(f.assessment.id, f.teacher.actor);
    await startReview(f.assessment.id, f.principal.actor);

    const result = await returnAssessment(
      f.assessment.id,
      "Missing supporting documents",
      f.principal.actor,
    );
    expect(result.status).toBe("RETURNED");
    expect(result.returnedReason).toBe("Missing supporting documents");
    expect(result.returnedById).toBe(f.principal.id);
  });

  it("TEST-W15: return without reason fails", async () => {
    const f = await buildFixture();
    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });
    await submitAssessment(f.assessment.id, f.teacher.actor);
    await startReview(f.assessment.id, f.principal.actor);

        await expect(
      returnAssessment(f.assessment.id, "no", f.principal.actor),
    ).rejects.toThrow(ValidationError);
  });
});

// ============================================================
// 6. Reopen
// ============================================================

describe("Reopen (RETURNED → DRAFT)", () => {
  it("TEST-W16: teacher can reopen a returned assessment", async () => {
    const f = await buildFixture();
    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });
    await submitAssessment(f.assessment.id, f.teacher.actor);
    await startReview(f.assessment.id, f.principal.actor);
    await returnAssessment(f.assessment.id, "Needs fixes", f.principal.actor);

    const result = await reopenReturnedAssessment(
      f.assessment.id,
      f.teacher.actor,
    );
    expect(result.status).toBe("DRAFT");
  });
});

// ============================================================
// 7. Locking
// ============================================================

describe("Locking (APPROVED → LOCKED)", () => {
  it("TEST-W17: principal can lock an approved assessment", async () => {
    const f = await buildFixture();
    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });
    await submitAssessment(f.assessment.id, f.teacher.actor);
    await startReview(f.assessment.id, f.principal.actor);
    await approveAssessment(f.assessment.id, f.principal.actor);

    const result = await lockAssessment(f.assessment.id, f.principal.actor);
    expect(result.status).toBe("LOCKED");
    expect(result.lockedAt).toBeTruthy();
    expect(result.lockedById).toBe(f.principal.id);
  });

  it("TEST-W18: cannot lock a DRAFT assessment", async () => {
    const f = await buildFixture();
    await expect(
      lockAssessment(f.assessment.id, f.principal.actor),
    ).rejects.toThrow(ConflictError);
  });

  it("TEST-W19: cannot reopen a LOCKED assessment directly", async () => {
    const f = await buildFixture();
    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });
    await submitAssessment(f.assessment.id, f.teacher.actor);
    await startReview(f.assessment.id, f.principal.actor);
    await approveAssessment(f.assessment.id, f.principal.actor);
    await lockAssessment(f.assessment.id, f.principal.actor);

    await expect(
      reopenReturnedAssessment(f.assessment.id, f.teacher.actor),
    ).rejects.toThrow(ConflictError);
  });
});

// ============================================================
// 8. Correction workflow
// ============================================================

describe("Correction workflow", () => {
  async function buildApprovedAssessment() {
    const f = await buildFixture();
    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });
    await submitAssessment(f.assessment.id, f.teacher.actor);
    await startReview(f.assessment.id, f.principal.actor);
    await approveAssessment(f.assessment.id, f.principal.actor);
    return f;
  }

  it("TEST-W20: teacher can request correction of own approved assessment", async () => {
    const f = await buildApprovedAssessment();

    const result = await requestCorrection(
      f.assessment.id,
      "Data-entry error on student1",
      [f.student1.id],
      f.teacher.actor,
    );

    expect(result.status).toBe("CORRECTION_PENDING");

    const corrections = await testPrisma.gradeCorrectionRequest.findMany({
      where: { assessmentId: f.assessment.id },
    });
    expect(corrections).toHaveLength(1);
    expect(corrections[0].status).toBe("PENDING");
    expect(corrections[0].reason).toBe("Data-entry error on student1");
  });

  it("TEST-W21: correction request without affected students fails", async () => {
    const f = await buildApprovedAssessment();
    await expect(
      requestCorrection(
        f.assessment.id,
        "Data-entry error",
        [],
        f.teacher.actor,
      ),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-W22: principal can authorize a correction", async () => {
    const f = await buildApprovedAssessment();

    await requestCorrection(
      f.assessment.id,
      "Data-entry error",
      [f.student1.id],
      f.teacher.actor,
    );

    const result = await authorizeCorrection(
      f.assessment.id,
      f.principal.actor,
    );

    expect(result.status).toBe("DRAFT");

    const corrections = await testPrisma.gradeCorrectionRequest.findMany({
      where: { assessmentId: f.assessment.id },
    });
    expect(corrections[0].status).toBe("AUTHORIZED");
    expect(corrections[0].authorizedById).toBe(f.principal.id);
  });

  it("TEST-W23: teacher cannot authorize their own correction request", async () => {
    const f = await buildApprovedAssessment();

    await requestCorrection(
      f.assessment.id,
      "Data-entry error",
      [f.student1.id],
      f.teacher.actor,
    );

    await expect(
      authorizeCorrection(f.assessment.id, f.teacher.actor),
    ).rejects.toThrow(ForbiddenError);
  });

  it("TEST-W24: principal can reject (cancel) a correction", async () => {
    const f = await buildApprovedAssessment();

    await requestCorrection(
      f.assessment.id,
      "Data-entry error",
      [f.student1.id],
      f.teacher.actor,
    );

    const result = await cancelCorrection(
      f.assessment.id,
      "Insufficient evidence",
      f.principal.actor,
    );

    expect(result.status).toBe("LOCKED");

    const corrections = await testPrisma.gradeCorrectionRequest.findMany({
      where: { assessmentId: f.assessment.id },
    });
    expect(corrections[0].status).toBe("REJECTED");
    expect(corrections[0].rejectionReason).toBe("Insufficient evidence");
  });

  it("TEST-W25: post-lock correction requires principal permission", async () => {
    const f = await buildApprovedAssessment();
    await lockAssessment(f.assessment.id, f.principal.actor);

    // Teacher cannot request post-lock
    await expect(
      requestPostLockCorrection(
        f.assessment.id,
        "Administrative error",
        [f.student1.id],
        f.teacher.actor,
      ),
    ).rejects.toThrow(ForbiddenError);

    // Principal can
    const result = await requestPostLockCorrection(
      f.assessment.id,
      "Administrative error",
      [f.student1.id],
      f.principal.actor,
    );
    expect(result.status).toBe("CORRECTION_PENDING");
  });
});

// ============================================================
// 9. Invalid transitions
// ============================================================

describe("Invalid transitions", () => {
  it("TEST-W26: APPROVED → SUBMITTED is rejected", async () => {
    const f = await buildFixture();
    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });
    await submitAssessment(f.assessment.id, f.teacher.actor);
    await startReview(f.assessment.id, f.principal.actor);
    await approveAssessment(f.assessment.id, f.principal.actor);

    await expect(
      submitAssessment(f.assessment.id, f.teacher.actor),
    ).rejects.toThrow(ConflictError);
  });

  it("TEST-W27: DRAFT → APPROVED is rejected", async () => {
    const f = await buildFixture();
    await expect(
      approveAssessment(f.assessment.id, f.principal.actor),
    ).rejects.toThrow(ConflictError);
  });

  it("TEST-W28: RETURNED → APPROVED is rejected", async () => {
    const f = await buildFixture();
    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });
    await submitAssessment(f.assessment.id, f.teacher.actor);
    await startReview(f.assessment.id, f.principal.actor);
    await returnAssessment(f.assessment.id, "Please fix", f.principal.actor);

    await expect(
      approveAssessment(f.assessment.id, f.principal.actor),
    ).rejects.toThrow(ConflictError);
  });

  it("TEST-W29: non-existent assessment → NotFoundError", async () => {
    const f = await buildFixture();
    await expect(
      submitAssessment("nonexistent-id", f.teacher.actor),
    ).rejects.toThrow();
  });
});

// ============================================================
// 10. Audit trail
// ============================================================

describe("Audit trail", () => {
  it("TEST-W30: submit writes an audit log entry", async () => {
    const f = await buildFixture();
    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });

    await submitAssessment(f.assessment.id, f.teacher.actor);

    const logs = await testPrisma.auditLog.findMany({
      where: {
        entity: "Assessment",
        entityId: f.assessment.id,
        action: "ASSESSMENT_SUBMITTED",
      },
    });
    expect(logs).toHaveLength(1);
        expect(logs[0].actorId).toBe(f.teacher.actor.id);
  });

  it("TEST-W31: approve writes an audit log entry", async () => {
    const f = await buildFixture();
    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });
    await submitAssessment(f.assessment.id, f.teacher.actor);
    await startReview(f.assessment.id, f.principal.actor);
    await approveAssessment(f.assessment.id, f.principal.actor);

    const logs = await testPrisma.auditLog.findMany({
      where: {
        entity: "Assessment",
        entityId: f.assessment.id,
        action: "ASSESSMENT_APPROVED",
      },
    });
    expect(logs).toHaveLength(1);
        expect(logs[0].actorId).toBe(f.principal.actor.id);
  });

  it("TEST-W32: full lifecycle produces the expected audit sequence", async () => {
    const f = await buildFixture();
    await createAssessmentResult(f.assessment.id, f.student1.id, f.teacher.actor.id, {
      score: 85,
    });
    await createAssessmentResult(f.assessment.id, f.student2.id, f.teacher.actor.id, {
      score: 72,
    });
    await submitAssessment(f.assessment.id, f.teacher.actor);
    await startReview(f.assessment.id, f.principal.actor);
    await approveAssessment(f.assessment.id, f.principal.actor);
    await lockAssessment(f.assessment.id, f.principal.actor);

    const logs = await testPrisma.auditLog.findMany({
      where: { entity: "Assessment", entityId: f.assessment.id },
      orderBy: { createdAt: "asc" },
    });

    expect(logs.map((l) => l.action)).toEqual([
      "ASSESSMENT_SUBMITTED",
      "ASSESSMENT_REVIEW_STARTED",
      "ASSESSMENT_APPROVED",
      "ASSESSMENT_LOCKED",
    ]);
  });
});