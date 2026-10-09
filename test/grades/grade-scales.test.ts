// ============================================================
// Grade Scales Service Tests
// ============================================================
// Covers authorization, band validation, ambiguity prevention,
// last-active-scale protection, destructive-change protection,
// transaction rollback, and end-to-end report-card grading.
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
  listGradeScales,
  getGradeScale,
  createGradeScale,
  updateGradeScale,
  activateGradeScale,
  archiveGradeScale,
  previewBandProblems,
  type GradeBandInput,
} from "../../src/lib/services/grades/grade-scales";
import { generateReportCard } from "../../src/lib/services/grades/report-card";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
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
          role: { include: { permissions: { include: { permission: true } } } },
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
// Actors
// ------------------------------------------------------------

/**
 * Rejection handler for `.catch(captureError)`: returns the thrown error so
 * its `issues` array can be asserted on.
 */
function captureError(error: unknown) {
  return error;
}

/** Read the validation issues off a captured error. */
function issuesOf(error: unknown): Array<{ path: string; message: string }> {
  const issues = (error as { issues?: unknown }).issues;
  return Array.isArray(issues)
    ? (issues as Array<{ path: string; message: string }>)
    : [];
}

interface Actors {
  schoolAdmin: CurrentUser;
  principal: CurrentUser;
  teacher: CurrentUser;
  accountant: CurrentUser;
  systemAdmin: CurrentUser;
  parent: CurrentUser;
  student: CurrentUser;
}

async function buildActors(): Promise<Actors> {
  const make = async (roleKey: string) => {
    const { user } = await createUser(roleKey as never);
    return buildCurrentUser(user.id);
  };

  return {
    schoolAdmin: await make(ROLES.SCHOOL_ADMIN),
    principal: await make(ROLES.PRINCIPAL),
    teacher: await make(ROLES.TEACHER),
    accountant: await make(ROLES.ACCOUNTANT),
    systemAdmin: await make(ROLES.SYSTEM_ADMIN),
    parent: await make(ROLES.PARENT),
    student: await make(ROLES.STUDENT),
  };
}

// ------------------------------------------------------------
// Band fixtures
// ------------------------------------------------------------
// Mirrors prisma/seed/grade-scales.ts exactly, including the 79.99
// style bounds. These must stay valid: a regression here would mean
// the seeded grading policy no longer passes validation.

function generalBands(): GradeBandInput[] {
  return [
    { minScore: 80, maxScore: 100, symbol: "A", description: "Excellent", points: 4.0, isPass: true },
    { minScore: 70, maxScore: 79.99, symbol: "B", description: "Very Good", points: 3.0, isPass: true },
    { minScore: 60, maxScore: 69.99, symbol: "C", description: "Good", points: 2.0, isPass: true },
    { minScore: 50, maxScore: 59.99, symbol: "D", description: "Satisfactory", points: 1.0, isPass: true },
    { minScore: 0, maxScore: 49.99, symbol: "F", description: "Fail", points: 0.0, isPass: false },
  ];
}

function tvetBands(): GradeBandInput[] {
  return [
    { minScore: 80, maxScore: 100, symbol: "C", description: "Competent (Distinction)", points: 4.0, isPass: true },
    { minScore: 60, maxScore: 79.99, symbol: "C+", description: "Competent (Proficient)", points: 3.0, isPass: true },
    { minScore: 50, maxScore: 59.99, symbol: "C-", description: "Competent (Satisfactory)", points: 2.0, isPass: true },
    { minScore: 0, maxScore: 49.99, symbol: "NYC", description: "Not Yet Competent", points: 0.0, isPass: false },
  ];
}

async function seedGeneralScale(actor: CurrentUser, name = "General Standard") {
  return createGradeScale(actor, {
    name,
    educationArea: "GENERAL",
    bands: generalBands(),
  });
}

async function seedTvetScale(actor: CurrentUser, name = "TVET Competency") {
  return createGradeScale(actor, {
    name,
    educationArea: "TVET",
    bands: tvetBands(),
  });
}

// ------------------------------------------------------------
// Report-card fixture
// ------------------------------------------------------------

interface ReportCardFixture {
  schoolAdmin: CurrentUser;
  student: { id: string };
  year: { id: string };
  term: { id: string };
  cls: { id: string };
  subject: { id: string };
  teacherActor: { id: string };
}

async function buildReportCardFixture(
  area: "GENERAL" | "TVET",
  levelCode: string,
  score: number,
): Promise<ReportCardFixture> {
  const level = await createEducationLevel(levelCode, {
    order: levelCode === "L3" ? 11 : 7,
    area,
  });
  const year = await createAcademicYear(`AY-${Date.now()}-${Math.random()}`);
  const term = await createTerm(year.id, `T-${Date.now()}-${Math.random()}`);
  const subject = await createSubject(`SUB-${Date.now()}-${Math.random()}`);

  const { user: tUser } = await createUser(ROLES.TEACHER);
  const teacher = await createTeacher(tUser.id);
  const teacherActor = await buildCurrentUser(tUser.id);

  const { user: aUser } = await createUser(ROLES.SCHOOL_ADMIN);
  const schoolAdmin = await buildCurrentUser(aUser.id);

  const cls = await createClass(year.id, level.id, {
    name: `${levelCode}A-${Date.now()}-${Math.random()}`,
  });
  await createTeacherAssignment(teacher.id, cls.id, year.id, subject.id);

  const { user: sUser } = await createUser(ROLES.STUDENT);
  const student = await createStudent({ userId: sUser.id });
  await createEnrollment(student.id, year.id, cls.id, level.id);

  const assessment = await createAssessment(
    teacher.id,
    cls.id,
    term.id,
    subject.id,
    { status: "APPROVED", maxScore: 100 },
  );
  await createAssessmentResult(assessment.id, student.id, teacherActor.id, {
    score,
  });

  return {
    schoolAdmin,
    student: { id: student.id },
    year: { id: year.id },
    term: { id: term.id },
    cls: { id: cls.id },
    subject: { id: subject.id },
    teacherActor: { id: teacherActor.id },
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
// 1. Authorization
// ============================================================

describe("Grade scale authorization", () => {
  it("TEST-GS01: school admin can list, read, create and update", async () => {
    const actors = await buildActors();

    const list = await listGradeScales(actors.schoolAdmin);
    expect(list).toEqual([]);

    const created = await seedGeneralScale(actors.schoolAdmin);
    expect(created.name).toBe("General Standard");
    expect(created.isActive).toBe(true);

    const detail = await getGradeScale(actors.schoolAdmin, created.id);
    expect(detail.bands).toHaveLength(5);
    expect(detail.bands[0].symbol).toBe("A");

    const updated = await updateGradeScale(actors.schoolAdmin, created.id, {
      name: "General Standard v2",
    });
    expect(updated.name).toBe("General Standard v2");
    // Bands are untouched when no band set is supplied.
    expect(updated.items).toHaveLength(5);

    // Archiving the only active scale is refused; see the
    // "Last active scale protection" suite for the full behaviour.
    await expect(
      archiveGradeScale(actors.schoolAdmin, created.id),
    ).rejects.toThrow(ConflictError);
  });

  it("TEST-GS02: principal cannot manage grade scales", async () => {
    const actors = await buildActors();
    await seedGeneralScale(actors.schoolAdmin);

    await expect(listGradeScales(actors.principal)).rejects.toThrow(ForbiddenError);
    await expect(
      createGradeScale(actors.principal, {
        name: "Principal Scale",
        educationArea: "GENERAL",
        bands: generalBands(),
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("TEST-GS03: teacher cannot manage grade scales", async () => {
    const actors = await buildActors();
    const scale = await seedGeneralScale(actors.schoolAdmin);

    await expect(listGradeScales(actors.teacher)).rejects.toThrow(ForbiddenError);
    await expect(
      getGradeScale(actors.teacher, scale.id),
    ).rejects.toThrow(ForbiddenError);
    await expect(
      updateGradeScale(actors.teacher, scale.id, { name: "Hacked" }),
    ).rejects.toThrow(ForbiddenError);
    await expect(
      archiveGradeScale(actors.teacher, scale.id),
    ).rejects.toThrow(ForbiddenError);
  });

  it("TEST-GS04: accountant and system admin retain no grade-scale access", async () => {
    const actors = await buildActors();

    for (const actor of [actors.accountant, actors.systemAdmin]) {
      await expect(listGradeScales(actor)).rejects.toThrow(ForbiddenError);
      await expect(
        createGradeScale(actor, {
          name: "Nope",
          educationArea: "GENERAL",
          bands: generalBands(),
        }),
      ).rejects.toThrow(ForbiddenError);
    }
  });

  it("TEST-GS05: parent and student cannot manage grade scales", async () => {
    const actors = await buildActors();
    const scale = await seedGeneralScale(actors.schoolAdmin);

    for (const actor of [actors.parent, actors.student]) {
      await expect(listGradeScales(actor)).rejects.toThrow(ForbiddenError);
      await expect(
        getGradeScale(actor, scale.id),
      ).rejects.toThrow(ForbiddenError);
    }
  });

  it("TEST-GS06: reading a non-existent scale returns NotFound", async () => {
    const actors = await buildActors();

    await expect(
      getGradeScale(actors.schoolAdmin, "does-not-exist"),
    ).rejects.toThrow(NotFoundError);
  });
});

// ============================================================
// 2. Band validation
// ============================================================

describe("Grade band validation", () => {
  it("TEST-GS07: the seeded general bands pass validation", async () => {
    // Guards the 79.99 → 80.00 boundary convention used by the seed.
    expect(previewBandProblems(generalBands())).toEqual([]);
  });

  it("TEST-GS08: the seeded TVET bands pass validation", async () => {
    expect(previewBandProblems(tvetBands())).toEqual([]);
  });

  it("TEST-GS09: a scale needs at least two bands", async () => {
    const actors = await buildActors();

    await expect(
      createGradeScale(actors.schoolAdmin, {
        name: "Too Small",
        educationArea: "GENERAL",
        bands: [{ minScore: 0, maxScore: 100, symbol: "X", isPass: true }],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-GS10: overlapping bands are rejected", async () => {
    const actors = await buildActors();

    const error = await createGradeScale(actors.schoolAdmin, {
      name: "Overlapping",
      educationArea: "GENERAL",
      bands: [
        { minScore: 80, maxScore: 100, symbol: "A", isPass: true },
        { minScore: 60, maxScore: 90, symbol: "B", isPass: true },
        { minScore: 0, maxScore: 59.99, symbol: "F", isPass: false },
      ],
    }).catch(captureError);

    expect(error).toBeInstanceOf(ValidationError);
    expect(issuesOf(error).some((i) => i.message.includes("overlap"))).toBe(true);
  });

  it("TEST-GS11: duplicate symbols are rejected", async () => {
    const actors = await buildActors();

    await expect(
      createGradeScale(actors.schoolAdmin, {
        name: "Duplicate Symbols",
        educationArea: "GENERAL",
        bands: [
          { minScore: 50, maxScore: 100, symbol: "P", isPass: true },
          { minScore: 0, maxScore: 49.99, symbol: "P", isPass: false },
        ],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-GS12: a real gap in the bands is detected", async () => {
    const actors = await buildActors();

    const error = await createGradeScale(actors.schoolAdmin, {
      name: "Gapped",
      educationArea: "GENERAL",
      bands: [
        { minScore: 80, maxScore: 100, symbol: "A", isPass: true },
        { minScore: 60, maxScore: 70, symbol: "B", isPass: true },
        { minScore: 0, maxScore: 50, symbol: "F", isPass: false },
      ],
    }).catch(captureError);

    expect(error).toBeInstanceOf(ValidationError);
    // 70 → 80 leaves 70.01–79.99 with no grade.
    expect(issuesOf(error).some((i) => i.message.includes("Gap between"))).toBe(
      true,
    );
  });

  it("TEST-GS13: a one-cent boundary is contiguous, not a gap", async () => {
    const actors = await buildActors();

    // 79.99 → 80.00: no representable score falls between them.
    const scale = await createGradeScale(actors.schoolAdmin, {
      name: "Cent Boundary",
      educationArea: "GENERAL",
      bands: generalBands(),
    });
    expect(scale.items).toHaveLength(5);
  });

  it("TEST-GS14: bands that do not reach 0 are rejected", async () => {
    const actors = await buildActors();

    await expect(
      createGradeScale(actors.schoolAdmin, {
        name: "No Floor",
        educationArea: "GENERAL",
        bands: [
          { minScore: 50, maxScore: 100, symbol: "P", isPass: true },
          { minScore: 30, maxScore: 49.99, symbol: "F", isPass: false },
        ],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-GS15: bands that do not reach 100 are rejected", async () => {
    const actors = await buildActors();

    await expect(
      createGradeScale(actors.schoolAdmin, {
        name: "No Ceiling",
        educationArea: "GENERAL",
        bands: [
          { minScore: 80, maxScore: 90, symbol: "A", isPass: true },
          { minScore: 0, maxScore: 79.99, symbol: "F", isPass: false },
        ],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-GS16: an inverted band is rejected", async () => {
    const actors = await buildActors();

    await expect(
      createGradeScale(actors.schoolAdmin, {
        name: "Inverted",
        educationArea: "GENERAL",
        bands: [
          { minScore: 90, maxScore: 80, symbol: "A", isPass: true },
          { minScore: 0, maxScore: 79.99, symbol: "F", isPass: false },
        ],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-GS17: scores outside 0–100 are rejected", async () => {
    const actors = await buildActors();

    await expect(
      createGradeScale(actors.schoolAdmin, {
        name: "Out Of Range",
        educationArea: "GENERAL",
        bands: [
          { minScore: 80, maxScore: 120, symbol: "A", isPass: true },
          { minScore: -10, maxScore: 79.99, symbol: "F", isPass: false },
        ],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-GS18: an empty scale name is rejected", async () => {
    const actors = await buildActors();

    await expect(
      createGradeScale(actors.schoolAdmin, {
        name: "  ",
        educationArea: "GENERAL",
        bands: generalBands(),
      }),
    ).rejects.toThrow(ValidationError);
  });
});

// ============================================================
// 3. Ambiguity prevention
// ============================================================

describe("Active scale uniqueness", () => {
  it("TEST-GS19: a second active scale for the same area is rejected", async () => {
    const actors = await buildActors();
    await seedGeneralScale(actors.schoolAdmin, "First General");

    await expect(
      seedGeneralScale(actors.schoolAdmin, "Second General"),
    ).rejects.toThrow(ConflictError);

    const scales = await testPrisma.gradeScale.findMany({
      where: { educationArea: "GENERAL", isActive: true },
    });
    expect(scales).toHaveLength(1);
  });

  it("TEST-GS20: an inactive scale for the same area is allowed", async () => {
    const actors = await buildActors();
    await seedGeneralScale(actors.schoolAdmin, "Active General");

    const inactive = await createGradeScale(actors.schoolAdmin, {
      name: "Spare General",
      educationArea: "GENERAL",
      bands: generalBands(),
      isActive: false,
    });

    expect(inactive.isActive).toBe(false);

    const all = await testPrisma.gradeScale.findMany({
      where: { educationArea: "GENERAL" },
    });
    expect(all).toHaveLength(2);
  });

  it("TEST-GS21: activating a second scale is rejected", async () => {
    const actors = await buildActors();
    const first = await seedGeneralScale(actors.schoolAdmin, "Active General");
    const spare = await createGradeScale(actors.schoolAdmin, {
      name: "Spare General",
      educationArea: "GENERAL",
      bands: generalBands(),
      isActive: false,
    });

    await expect(
      updateGradeScale(actors.schoolAdmin, spare.id, { isActive: true }),
    ).rejects.toThrow(ConflictError);

    const reloaded = await testPrisma.gradeScale.findUnique({
      where: { id: spare.id },
    });
    expect(reloaded?.isActive).toBe(false);
    expect(first.isActive).toBe(true);
  });

  it("TEST-GS22: general and TVET scales coexist independently", async () => {
    const actors = await buildActors();
    await seedGeneralScale(actors.schoolAdmin, "General Standard");
    await seedTvetScale(actors.schoolAdmin, "TVET Competency");

    const scales = await listGradeScales(actors.schoolAdmin);
    const active = scales.filter((s) => s.isActive);

    expect(active).toHaveLength(2);
    expect(active.map((s) => s.educationArea).sort()).toEqual([
      "GENERAL",
      "TVET",
    ]);
  });
});

// ============================================================
// 4. Last active scale protection
// ============================================================

describe("Last active scale protection", () => {
  it("TEST-GS23: archiving the only active scale is rejected", async () => {
    const actors = await buildActors();
    const scale = await seedGeneralScale(actors.schoolAdmin);

    await expect(
      archiveGradeScale(actors.schoolAdmin, scale.id),
    ).rejects.toThrow(ConflictError);

    const reloaded = await testPrisma.gradeScale.findUnique({
      where: { id: scale.id },
    });
    expect(reloaded?.isActive).toBe(true);
  });

  it("TEST-GS24: activating a replacement supersedes the incumbent atomically", async () => {
    const actors = await buildActors();
    const old = await seedGeneralScale(actors.schoolAdmin, "Old General");

    const next = await createGradeScale(actors.schoolAdmin, {
      name: "New General",
      educationArea: "GENERAL",
      bands: generalBands(),
      isActive: false,
    });

    await activateGradeScale(actors.schoolAdmin, next.id);

    const active = await testPrisma.gradeScale.findMany({
      where: { educationArea: "GENERAL", isActive: true },
    });
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(next.id);

    // The incumbent is archived, not deleted, and still readable.
    const oldRow = await testPrisma.gradeScale.findUnique({
      where: { id: old.id },
    });
    expect(oldRow?.isActive).toBe(false);
  });

  it("TEST-GS25: activating an already-active scale is rejected", async () => {
    const actors = await buildActors();
    const scale = await seedGeneralScale(actors.schoolAdmin, "Active General");

    await expect(
      activateGradeScale(actors.schoolAdmin, scale.id),
    ).rejects.toThrow(ConflictError);
  });

  it("TEST-GS25b: archiving a superseded scale is rejected as already archived", async () => {
    const actors = await buildActors();
    const first = await seedGeneralScale(actors.schoolAdmin, "First General");

    const second = await createGradeScale(actors.schoolAdmin, {
      name: "Second General",
      educationArea: "GENERAL",
      bands: generalBands(),
      isActive: false,
    });

    // Activating the second supersedes the first, leaving it inactive.
    await activateGradeScale(actors.schoolAdmin, second.id);

    const firstRow = await testPrisma.gradeScale.findUnique({
      where: { id: first.id },
    });
    expect(firstRow?.isActive).toBe(false);

    await expect(
      archiveGradeScale(actors.schoolAdmin, first.id),
    ).rejects.toThrow(ConflictError);
  });

  it("TEST-GS26: deactivating via update respects the last-active rule", async () => {
    const actors = await buildActors();
    const scale = await seedGeneralScale(actors.schoolAdmin);

    await expect(
      updateGradeScale(actors.schoolAdmin, scale.id, { isActive: false }),
    ).rejects.toThrow(ConflictError);

    const reloaded = await testPrisma.gradeScale.findUnique({
      where: { id: scale.id },
    });
    expect(reloaded?.isActive).toBe(true);
  });
});

// ============================================================
// 5. Transaction rollback
// ============================================================

describe("Update rollback", () => {
  it("TEST-GS27: a failed band update leaves the scale untouched", async () => {
    const actors = await buildActors();
    const scale = await seedGeneralScale(actors.schoolAdmin, "Rollback Test");

    const before = await getGradeScale(actors.schoolAdmin, scale.id);

    await expect(
      updateGradeScale(actors.schoolAdmin, scale.id, {
        name: "Should Not Persist",
        bands: [
          { minScore: 80, maxScore: 100, symbol: "A", isPass: true },
          { minScore: 60, maxScore: 90, symbol: "B", isPass: true }, // overlaps A
          { minScore: 0, maxScore: 59.99, symbol: "F", isPass: false },
        ],
      }),
    ).rejects.toThrow(ValidationError);

    const after = await getGradeScale(actors.schoolAdmin, scale.id);

    expect(after.name).toBe(before.name);
    expect(after.bands).toEqual(before.bands);
  });

  it("TEST-GS28: a failed update leaves no grade scale items behind", async () => {
    const actors = await buildActors();
    const scale = await seedGeneralScale(actors.schoolAdmin);

    const beforeCount = await testPrisma.gradeScaleItem.count({
      where: { gradeScaleId: scale.id },
    });
    expect(beforeCount).toBe(5);

    await expect(
      updateGradeScale(actors.schoolAdmin, scale.id, {
        bands: [
          { minScore: 80, maxScore: 100, symbol: "A", isPass: true },
          { minScore: 0, maxScore: 79.99, symbol: "A", isPass: false }, // duplicate symbol
        ],
      }),
    ).rejects.toThrow(ValidationError);

    const afterCount = await testPrisma.gradeScaleItem.count({
      where: { gradeScaleId: scale.id },
    });
    expect(afterCount).toBe(beforeCount);
  });

  it("TEST-GS29: a successful band update replaces the whole band set", async () => {
    const actors = await buildActors();
    const scale = await seedGeneralScale(actors.schoolAdmin);

    await updateGradeScale(actors.schoolAdmin, scale.id, {
      bands: tvetBands(),
    });

    const after = await getGradeScale(actors.schoolAdmin, scale.id);
    expect(after.bands.map((b) => b.symbol)).toEqual(["C", "C+", "C-", "NYC"]);
    expect(after.bands.map((b) => b.order)).toEqual([1, 2, 3, 4]);
  });

  it("TEST-GS30: band order follows score, highest first", async () => {
    const actors = await buildActors();

    const scale = await createGradeScale(actors.schoolAdmin, {
      name: "Unordered Input",
      educationArea: "GENERAL",
      bands: [
        { minScore: 0, maxScore: 49.99, symbol: "F", isPass: false },
        { minScore: 80, maxScore: 100, symbol: "A", isPass: true },
        { minScore: 60, maxScore: 69.99, symbol: "C", isPass: true },
        { minScore: 50, maxScore: 59.99, symbol: "D", isPass: true },
        { minScore: 70, maxScore: 79.99, symbol: "B", isPass: true },
      ],
    });

    const detail = await getGradeScale(actors.schoolAdmin, scale.id);
    expect(detail.bands.map((b) => b.symbol)).toEqual(["A", "B", "C", "D", "F"]);
    expect(detail.bands.map((b) => Number(b.order))).toEqual([1, 2, 3, 4, 5]);
  });
});

// ============================================================
// 6. Destructive-change protection
// ============================================================

describe("Protection of scales in use", () => {
  it("TEST-GS31: a symbol on an existing report card cannot be removed", async () => {
    const actors = await buildActors();
    const f = await buildReportCardFixture("GENERAL", "S1", 85);

    const scale = await seedGeneralScale(actors.schoolAdmin);
    await generateReportCard({
      studentId: f.student.id,
      termId: f.term.id,
      actor: f.schoolAdmin,
    });

    const detail = await getGradeScale(actors.schoolAdmin, scale.id);
    expect(detail.reportCardCount).toBe(1);
    expect(detail.usedSymbols).toContain("A");

    // Dropping the "A" band would orphan the grade on that card.
    await expect(
      updateGradeScale(actors.schoolAdmin, scale.id, {
        bands: [
          { minScore: 70, maxScore: 100, symbol: "B", isPass: true },
          { minScore: 60, maxScore: 69.99, symbol: "C", isPass: true },
          { minScore: 50, maxScore: 59.99, symbol: "D", isPass: true },
          { minScore: 0, maxScore: 49.99, symbol: "F", isPass: false },
        ],
      }),
    ).rejects.toThrow(ValidationError);

    const after = await getGradeScale(actors.schoolAdmin, scale.id);
    expect(after.bands.map((b) => b.symbol)).toEqual(["A", "B", "C", "D", "F"]);
  });

  it("TEST-GS32: adjusting a used band's range is allowed", async () => {
    const actors = await buildActors();
    const f = await buildReportCardFixture("GENERAL", "S1", 85);

    const scale = await seedGeneralScale(actors.schoolAdmin);
    await generateReportCard({
      studentId: f.student.id,
      termId: f.term.id,
      actor: f.schoolAdmin,
    });

    // Move the A threshold from 80 down to 75 — the symbol survives.
    const updated = await updateGradeScale(actors.schoolAdmin, scale.id, {
      bands: [
        { minScore: 75, maxScore: 100, symbol: "A", isPass: true },
        { minScore: 70, maxScore: 74.99, symbol: "B", isPass: true },
        { minScore: 60, maxScore: 69.99, symbol: "C", isPass: true },
        { minScore: 50, maxScore: 59.99, symbol: "D", isPass: true },
        { minScore: 0, maxScore: 49.99, symbol: "F", isPass: false },
      ],
    });

    const detail = await getGradeScale(actors.schoolAdmin, updated.id);
    const aBand = detail.bands.find((b) => b.symbol === "A");
    expect(Number(aBand?.minScore)).toBe(75);
  });

  it("TEST-GS33: an unused scale reports zero report cards", async () => {
    const actors = await buildActors();
    const scale = await seedGeneralScale(actors.schoolAdmin);

    const detail = await getGradeScale(actors.schoolAdmin, scale.id);
    expect(detail.reportCardCount).toBe(0);
    expect(detail.usedSymbols).toEqual([]);
  });
});

// ============================================================
// 7. End-to-end grading
// ============================================================

describe("Report card grading with configured scales", () => {
  it("TEST-GS34: general students receive general letter grades", async () => {
    const actors = await buildActors();
    const f = await buildReportCardFixture("GENERAL", "S1", 85);
    await seedGeneralScale(actors.schoolAdmin, "General Standard");

    const rc = await generateReportCard({
      studentId: f.student.id,
      termId: f.term.id,
      actor: f.schoolAdmin,
    });

    const items = await testPrisma.reportCardItem.findMany({
      where: { reportCardId: rc.id },
    });
    expect(items[0].grade).toBe("A");
  });

  it("TEST-GS35: TVET students receive competency grades", async () => {
    const actors = await buildActors();
    const f = await buildReportCardFixture("TVET", "L3", 85);
    await seedGeneralScale(actors.schoolAdmin, "General Standard");
    await seedTvetScale(actors.schoolAdmin, "TVET Competency");

    const rc = await generateReportCard({
      studentId: f.student.id,
      termId: f.term.id,
      actor: f.schoolAdmin,
    });

    const items = await testPrisma.reportCardItem.findMany({
      where: { reportCardId: rc.id },
    });
    // 85% on the TVET scale is "C", never "A".
    expect(items[0].grade).toBe("C");
  });

  it("TEST-GS36: TVET grading is independent of the general scale", async () => {
    const actors = await buildActors();
    const generalFixture = await buildReportCardFixture("GENERAL", "S1", 72);
    const tvetFixture = await buildReportCardFixture("TVET", "L3", 72);

    await seedGeneralScale(actors.schoolAdmin, "General Standard");
    await seedTvetScale(actors.schoolAdmin, "TVET Competency");

    const generalCard = await generateReportCard({
      studentId: generalFixture.student.id,
      termId: generalFixture.term.id,
      actor: generalFixture.schoolAdmin,
    });
    const tvetCard = await generateReportCard({
      studentId: tvetFixture.student.id,
      termId: tvetFixture.term.id,
      actor: tvetFixture.schoolAdmin,
    });

    const generalItems = await testPrisma.reportCardItem.findMany({
      where: { reportCardId: generalCard.id },
    });
    const tvetItems = await testPrisma.reportCardItem.findMany({
      where: { reportCardId: tvetCard.id },
    });

    expect(generalItems[0].grade).toBe("B");
    expect(tvetItems[0].grade).toBe("C+");
  });

  it("TEST-GS37: a missing scale blocks generation instead of guessing", async () => {
    const f = await buildReportCardFixture("GENERAL", "S1", 85);
    // No scale seeded at all.

    await expect(
      generateReportCard({
        studentId: f.student.id,
        termId: f.term.id,
        actor: f.schoolAdmin,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-GS38: report cards keep grades generated by the old scale", async () => {
    const actors = await buildActors();
    const f = await buildReportCardFixture("GENERAL", "S1", 85);

    const scale = await seedGeneralScale(actors.schoolAdmin, "Original");
    const rc = await generateReportCard({
      studentId: f.student.id,
      termId: f.term.id,
      actor: f.schoolAdmin,
    });

    const itemsBefore = await testPrisma.reportCardItem.findMany({
      where: { reportCardId: rc.id },
    });
    expect(itemsBefore[0].grade).toBe("A");

    // Replace the scale so 85% would now map to a different symbol.
    const spare = await createGradeScale(actors.schoolAdmin, {
      name: "Replacement",
      educationArea: "GENERAL",
      bands: [
        { minScore: 90, maxScore: 100, symbol: "A+", isPass: true },
        { minScore: 80, maxScore: 89.99, symbol: "A", isPass: true },
        { minScore: 70, maxScore: 79.99, symbol: "B", isPass: true },
        { minScore: 60, maxScore: 69.99, symbol: "C", isPass: true },
        { minScore: 0, maxScore: 59.99, symbol: "F", isPass: false },
      ],
      isActive: false,
    });
    await activateGradeScale(actors.schoolAdmin, spare.id);

    // The incumbent is superseded but retained for history.
    const originalRow = await testPrisma.gradeScale.findUnique({
      where: { id: scale.id },
    });
    expect(originalRow?.isActive).toBe(false);

    // The already-generated card is a snapshot and must not change.
    const itemsAfter = await testPrisma.reportCardItem.findMany({
      where: { reportCardId: rc.id },
    });
    expect(itemsAfter[0].grade).toBe("A");
  });
});

// ============================================================
// 8. Audit
// ============================================================

describe("Grade scale audit trail", () => {
  it("TEST-GS39: create, update and activate are audited", async () => {
    const actors = await buildActors();
    const scale = await seedGeneralScale(actors.schoolAdmin, "Audited Scale");

    const created = await testPrisma.auditLog.findFirst({
      where: { action: "GRADE_SCALE_CREATED", entityId: scale.id },
    });
    expect(created?.actorId).toBe(actors.schoolAdmin.id);
    expect(
      (created?.newValue as { educationArea: string }).educationArea,
    ).toBe("GENERAL");

    await updateGradeScale(actors.schoolAdmin, scale.id, {
      name: "Audited Scale v2",
      bands: tvetBands(),
    });

    const updated = await testPrisma.auditLog.findFirst({
      where: { action: "GRADE_SCALE_UPDATED", entityId: scale.id },
    });
    expect(updated?.previousValue).toMatchObject({ name: "Audited Scale" });
    expect(updated?.newValue).toMatchObject({ name: "Audited Scale v2" });
    // Both band sets are captured so the change is reconstructable.
    const previousBands = (updated?.previousValue as { bands: unknown[] }).bands;
    const newBands = (updated?.newValue as { bands: unknown[] }).bands;
    expect(previousBands).toHaveLength(5);
    expect(newBands).toHaveLength(4);
  });

  it("TEST-GS40: activation records the superseded scale", async () => {
    const actors = await buildActors();
    const old = await seedGeneralScale(actors.schoolAdmin, "Old General");
    const next = await createGradeScale(actors.schoolAdmin, {
      name: "New General",
      educationArea: "GENERAL",
      bands: generalBands(),
      isActive: false,
    });

    await activateGradeScale(actors.schoolAdmin, next.id);

    const log = await testPrisma.auditLog.findFirst({
      where: { action: "GRADE_SCALE_UPDATED", entityId: next.id },
      orderBy: { createdAt: "desc" },
    });

    expect(log?.description).toContain("replacing");
    expect(log?.previousValue).toMatchObject({
      isActive: false,
      supersededScaleIds: [old.id],
    });
    expect(log?.newValue).toMatchObject({ isActive: true });
  });

  it("TEST-GS41: archiving a scale is audited", async () => {
    const actors = await buildActors();
    await seedGeneralScale(actors.schoolAdmin, "First General");
    const second = await createGradeScale(actors.schoolAdmin, {
      name: "Second General",
      educationArea: "GENERAL",
      bands: generalBands(),
      isActive: false,
    });

    // Simulate pre-existing data with two active scales so the archive
    // guard passes; this is the only state in which archiving is valid.
    await testPrisma.gradeScale.update({
      where: { id: second.id },
      data: { isActive: true },
    });

    const archived = await archiveGradeScale(actors.schoolAdmin, second.id);
    expect(archived.isActive).toBe(false);

    const log = await testPrisma.auditLog.findFirst({
      where: { action: "GRADE_SCALE_ARCHIVED", entityId: second.id },
    });
    expect(log?.actorId).toBe(actors.schoolAdmin.id);
    expect(log?.previousValue).toMatchObject({ isActive: true });
    expect(log?.newValue).toMatchObject({ isActive: false });
  });

  it("TEST-GS42: a rejected write is not audited", async () => {
    const actors = await buildActors();
    const scale = await seedGeneralScale(actors.schoolAdmin);

    await expect(
      updateGradeScale(actors.schoolAdmin, scale.id, {
        bands: [
          { minScore: 80, maxScore: 100, symbol: "A", isPass: true },
          { minScore: 60, maxScore: 90, symbol: "B", isPass: true },
          { minScore: 0, maxScore: 59.99, symbol: "F", isPass: false },
        ],
      }),
    ).rejects.toThrow(ValidationError);

    const logs = await testPrisma.auditLog.findMany({
      where: { action: "GRADE_SCALE_UPDATED", entityId: scale.id },
    });
    expect(logs).toHaveLength(0);
  });
});

// ============================================================
// 9. Listing
// ============================================================

describe("Listing scales", () => {
  it("TEST-GS43: list reports band counts and report-card usage", async () => {
    const actors = await buildActors();
    const general = await seedGeneralScale(actors.schoolAdmin, "General Standard");
    const tvet = await seedTvetScale(actors.schoolAdmin, "TVET Competency");

    const f = await buildReportCardFixture("GENERAL", "S1", 85);
    await generateReportCard({
      studentId: f.student.id,
      termId: f.term.id,
      actor: f.schoolAdmin,
    });

    const scales = await listGradeScales(actors.schoolAdmin);
    expect(scales).toHaveLength(2);

    const generalRow = scales.find((s) => s.id === general.id);
    const tvetRow = scales.find((s) => s.id === tvet.id);

    expect(generalRow?.bandCount).toBe(5);
    expect(generalRow?.reportCardCount).toBe(1);
    expect(tvetRow?.bandCount).toBe(4);
    expect(tvetRow?.reportCardCount).toBe(0);
  });

  it("TEST-GS44: inactive scales can be excluded", async () => {
    const actors = await buildActors();
    const active = await seedGeneralScale(actors.schoolAdmin, "Active");
    const spare = await createGradeScale(actors.schoolAdmin, {
      name: "Spare",
      educationArea: "GENERAL",
      bands: generalBands(),
      isActive: false,
    });

    const all = await listGradeScales(actors.schoolAdmin);
    expect(all).toHaveLength(2);

    const onlyActive = await listGradeScales(actors.schoolAdmin, {
      includeInactive: false,
    });
    expect(onlyActive).toHaveLength(1);
    expect(onlyActive[0].id).toBe(active.id);
    expect(onlyActive.map((s) => s.id)).not.toContain(spare.id);
  });
});
