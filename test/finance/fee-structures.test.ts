// ============================================================
// Finance — Fee Structure Service Tests
// ============================================================

import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { testPrisma, resetDatabase, resetUserData } from "../setup";
import {
  createUser,
  createEducationLevel,
  createAcademicYear,
} from "../factories";
import { ROLES } from "../../src/lib/permissions/constants";
import type { CurrentUser } from "../../src/lib/auth/session";
import {
  listFeeStructures,
  createFeeStructure,
  archiveFeeStructure,
  listEducationLevelsForPicker,
} from "../../src/lib/services/finance/fee-structures";
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
  await testPrisma.feeStructure.deleteMany();
  await resetUserData();
});

// ============================================================
// createFeeStructure
// ============================================================

describe("createFeeStructure", () => {
  it("TEST-FS01: accountant can create a fee structure for an education level", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const actor = await buildCurrentUser(user.id);

    const year = await createAcademicYear("AY-FS01");
    const level = await createEducationLevel("S1", { order: 7 });

    const created = await createFeeStructure(actor, {
      name: "Tuition S1 - Term 1",
      academicYearId: year.id,
      educationLevelId: level.id,
      feeType: "TUITION",
      amount: 150000,
    });

    expect(created.id).toBeTruthy();
    expect(created.name).toBe("Tuition S1 - Term 1");
    expect(created.feeType).toBe("TUITION");
    expect(created.amount.toString()).toBe("150000");
    expect(created.educationLevelId).toBe(level.id);
    expect(created.tradeId).toBeNull();
    expect(created.isActive).toBe(true);
  });

  it("TEST-FS02: school admin can create a fee structure for a trade (TVET)", async () => {
    const { user } = await createUser(ROLES.SCHOOL_ADMIN);
    const actor = await buildCurrentUser(user.id);

    const year = await createAcademicYear("AY-FS02");

    const trade = await testPrisma.trade.upsert({
      where: { code: "TEST_TRADE_FS02" },
      update: {},
      create: { code: "TEST_TRADE_FS02", name: "Test Trade FS02" },
    });

    const created = await createFeeStructure(actor, {
      name: "TVET Workshop Fee - Term 1",
      academicYearId: year.id,
      tradeId: trade.id,
      feeType: "TUITION",
      amount: 200000,
    });

    expect(created.tradeId).toBe(trade.id);
    expect(created.educationLevelId).toBeNull();
  });

  it("TEST-FS03: teacher cannot create a fee structure", async () => {
    const { user } = await createUser(ROLES.TEACHER);
    const actor = await buildCurrentUser(user.id);

    const year = await createAcademicYear("AY-FS03");
    const level = await createEducationLevel("S2", { order: 8 });

    await expect(
      createFeeStructure(actor, {
        name: "Test",
        academicYearId: year.id,
        educationLevelId: level.id,
        feeType: "TUITION",
        amount: 100000,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("TEST-FS04: rejects empty name", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const actor = await buildCurrentUser(user.id);

    const year = await createAcademicYear("AY-FS04");
    const level = await createEducationLevel("S3", { order: 9 });

    await expect(
      createFeeStructure(actor, {
        name: "   ",
        academicYearId: year.id,
        educationLevelId: level.id,
        feeType: "TUITION",
        amount: 100000,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-FS05: rejects non-positive amount", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const actor = await buildCurrentUser(user.id);

    const year = await createAcademicYear("AY-FS05");
    const level = await createEducationLevel("S4", { order: 10 });

    await expect(
      createFeeStructure(actor, {
        name: "Bad Amount",
        academicYearId: year.id,
        educationLevelId: level.id,
        feeType: "TUITION",
        amount: 0,
      }),
    ).rejects.toThrow(ValidationError);

    await expect(
      createFeeStructure(actor, {
        name: "Negative",
        academicYearId: year.id,
        educationLevelId: level.id,
        feeType: "TUITION",
        amount: -500,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-FS06: rejects when both educationLevelId and tradeId are set", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const actor = await buildCurrentUser(user.id);

    const year = await createAcademicYear("AY-FS06");
    const level = await createEducationLevel("S5", { order: 11 });

    const trade = await testPrisma.trade.upsert({
      where: { code: "TEST_TRADE_FS06" },
      update: {},
      create: { code: "TEST_TRADE_FS06", name: "Test Trade FS06" },
    });

    await expect(
      createFeeStructure(actor, {
        name: "Conflicting targets",
        academicYearId: year.id,
        educationLevelId: level.id,
        tradeId: trade.id,
        feeType: "TUITION",
        amount: 100000,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-FS07: rejects when neither educationLevelId nor tradeId is set", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const actor = await buildCurrentUser(user.id);

    const year = await createAcademicYear("AY-FS07");

    await expect(
      createFeeStructure(actor, {
        name: "No target",
        academicYearId: year.id,
        feeType: "TUITION",
        amount: 100000,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-FS08: rejects unknown education level", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const actor = await buildCurrentUser(user.id);

    const year = await createAcademicYear("AY-FS08");

    await expect(
      createFeeStructure(actor, {
        name: "Unknown level",
        academicYearId: year.id,
        educationLevelId: "nonexistent-level-id",
        feeType: "TUITION",
        amount: 100000,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("TEST-FS09: writes an audit log on creation", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const actor = await buildCurrentUser(user.id);

    const year = await createAcademicYear("AY-FS09");
    const level = await createEducationLevel("P1", { order: 1 });

    const created = await createFeeStructure(actor, {
      name: "Audited Fee",
      academicYearId: year.id,
      educationLevelId: level.id,
      feeType: "TUITION",
      amount: 100000,
    });

    const logs = await testPrisma.auditLog.findMany({
      where: {
        entity: "FeeStructure",
        entityId: created.id,
        action: "FEE_STRUCTURE_CREATED",
      },
    });

    expect(logs.length).toBe(1);
    expect(logs[0].actorId).toBe(actor.id);
  });
});

// ============================================================
// listFeeStructures
// ============================================================

describe("listFeeStructures", () => {
  it("TEST-FS10: returns fee structures for a given academic year", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const actor = await buildCurrentUser(user.id);

    const year1 = await createAcademicYear("AY-FS10-Y1");
    const year2 = await createAcademicYear("AY-FS10-Y2");
    const level = await createEducationLevel("P2", { order: 2 });

    await createFeeStructure(actor, {
      name: "Fee Y1",
      academicYearId: year1.id,
      educationLevelId: level.id,
      feeType: "TUITION",
      amount: 100000,
    });
    await createFeeStructure(actor, {
      name: "Fee Y2",
      academicYearId: year2.id,
      educationLevelId: level.id,
      feeType: "TUITION",
      amount: 120000,
    });

    const list = await listFeeStructures(actor, {
      academicYearId: year1.id,
    });

    expect(list.length).toBe(1);
    expect(list[0].name).toBe("Fee Y1");
    expect(list[0].academicYearName).toBe("AY-FS10-Y1");
  });

  it("TEST-FS11: excludes inactive structures by default", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const actor = await buildCurrentUser(user.id);

    const year = await createAcademicYear("AY-FS11");
    const level = await createEducationLevel("P3", { order: 3 });

    const created = await createFeeStructure(actor, {
      name: "Will be archived",
      academicYearId: year.id,
      educationLevelId: level.id,
      feeType: "TUITION",
      amount: 100000,
    });

    await archiveFeeStructure(actor, created.id);

    const activeList = await listFeeStructures(actor, {
      academicYearId: year.id,
    });
    expect(activeList.length).toBe(0);

    const allList = await listFeeStructures(actor, {
      academicYearId: year.id,
      includeInactive: true,
    });
    expect(allList.length).toBe(1);
    expect(allList[0].isActive).toBe(false);
  });

  it("TEST-FS12: teacher cannot list fee structures", async () => {
    const { user } = await createUser(ROLES.TEACHER);
    const actor = await buildCurrentUser(user.id);

    await expect(listFeeStructures(actor)).rejects.toThrow(ForbiddenError);
  });
});

// ============================================================
// archiveFeeStructure
// ============================================================

describe("archiveFeeStructure", () => {
  it("TEST-FS13: accountant can archive an unused fee structure", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const actor = await buildCurrentUser(user.id);

    const year = await createAcademicYear("AY-FS13");
    const level = await createEducationLevel("P4", { order: 4 });

    const created = await createFeeStructure(actor, {
      name: "To Archive",
      academicYearId: year.id,
      educationLevelId: level.id,
      feeType: "TUITION",
      amount: 100000,
    });

    const archived = await archiveFeeStructure(actor, created.id);
    expect(archived.isActive).toBe(false);
  });

  it("TEST-FS14: rejects archiving a nonexistent fee structure", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const actor = await buildCurrentUser(user.id);

    await expect(
      archiveFeeStructure(actor, "nonexistent-id"),
    ).rejects.toThrow();
  });

  it("TEST-FS15: teacher cannot archive", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const actor = await buildCurrentUser(user.id);

    const year = await createAcademicYear("AY-FS15");
    const level = await createEducationLevel("P5", { order: 5 });

    const created = await createFeeStructure(actor, {
      name: "Fee for permission test",
      academicYearId: year.id,
      educationLevelId: level.id,
      feeType: "TUITION",
      amount: 100000,
    });

    const { user: teacherUser } = await createUser(ROLES.TEACHER);
    const teacherActor = await buildCurrentUser(teacherUser.id);

    await expect(
      archiveFeeStructure(teacherActor, created.id),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ============================================================
// pickers
// ============================================================

describe("pickers", () => {
  it("TEST-FS16: listEducationLevelsForPicker returns active levels", async () => {
    const { user } = await createUser(ROLES.ACCOUNTANT);
    const actor = await buildCurrentUser(user.id);

    await createEducationLevel("P6", { order: 6 });
    await createEducationLevel("S6", { order: 12 });

    const levels = await listEducationLevelsForPicker(actor);
    expect(levels.length).toBeGreaterThanOrEqual(2);
    expect(levels.some((l) => l.code === "P6")).toBe(true);
  });
});