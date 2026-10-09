// ============================================================
// Test Setup
// ============================================================
// Runs before every test file. Provides:
//   - Test Prisma client (connects to TEST_DATABASE_URL)
//   - Database reset helper
// ============================================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { beforeAll, afterAll } from "vitest";

// ------------------------------------------------------------
// Test database URL
// ------------------------------------------------------------

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error(
    "TEST_DATABASE_URL is not set. Add it to .env: TEST_DATABASE_URL=postgresql://...",
  );
}

// ------------------------------------------------------------
// Test Prisma client
// ------------------------------------------------------------

const adapter = new PrismaPg({ connectionString: TEST_DATABASE_URL });
export const testPrisma = new PrismaClient({ adapter });

// ------------------------------------------------------------
// Global lifecycle
// ------------------------------------------------------------

beforeAll(async () => {
  // Ensure test DB is ready. Migrations should already be applied
  // via `npx prisma migrate deploy` — run before tests.
  await testPrisma.$connect();
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

// ------------------------------------------------------------
// Database reset helper
// ------------------------------------------------------------
// Deletes all rows in FK-safe order. Called by individual tests
// when they need a clean slate.

export async function resetDatabase() {
  await testPrisma.$transaction([
    testPrisma.auditLog.deleteMany(),
    testPrisma.gradeCorrectionRequest.deleteMany(),
    testPrisma.gradeScaleItem.deleteMany(),
    testPrisma.gradeScale.deleteMany(),
    testPrisma.reportCardItem.deleteMany(),
    testPrisma.reportCard.deleteMany(),
    testPrisma.assessmentResult.deleteMany(),
    testPrisma.assessment.deleteMany(),
    testPrisma.attendance.deleteMany(),
    testPrisma.attendanceSession.deleteMany(),
    testPrisma.lesson.deleteMany(),
    testPrisma.timetableVersion.deleteMany(),
    testPrisma.teacherAssignment.deleteMany(),
    testPrisma.classSubject.deleteMany(),
    testPrisma.classModule.deleteMany(),
    testPrisma.enrollment.deleteMany(),
    testPrisma.invoiceDiscount.deleteMany(),
    testPrisma.payment.deleteMany(),
    testPrisma.receipt.deleteMany(),
    testPrisma.invoiceItem.deleteMany(),
    testPrisma.invoice.deleteMany(),
    testPrisma.scholarship.deleteMany(),
    testPrisma.feeStructure.deleteMany(),
    testPrisma.parentStudent.deleteMany(),
    testPrisma.student.deleteMany(),
    testPrisma.parent.deleteMany(),
    testPrisma.teacher.deleteMany(),
    testPrisma.staffProfile.deleteMany(),
    testPrisma.class.deleteMany(),
    testPrisma.pathway.deleteMany(),
    testPrisma.subjectLevel.deleteMany(),
    testPrisma.subject.deleteMany(),
    testPrisma.module.deleteMany(),
    testPrisma.trade.deleteMany(),
    testPrisma.holiday.deleteMany(),
    testPrisma.term.deleteMany(),
    testPrisma.academicYear.deleteMany(),
    testPrisma.educationLevel.deleteMany(),
    testPrisma.announcement.deleteMany(),
    testPrisma.notification.deleteMany(),
    testPrisma.userRole.deleteMany(),
    testPrisma.rolePermission.deleteMany(),
    testPrisma.permission.deleteMany(),
    testPrisma.role.deleteMany(),
    testPrisma.file.deleteMany(),
    testPrisma.user.deleteMany(),
    testPrisma.schoolInfo.deleteMany(),
  ]);
}

// ------------------------------------------------------------
// Test DB migration helper
// ------------------------------------------------------------
// Called once before all tests, applies migrations to the test DB.
// Uses `prisma migrate deploy` which is idempotent.

import { execSync } from "node:child_process";

export function applyMigrationsToTestDb() {
  console.log("Applying migrations to test database...");
  execSync("npx prisma migrate deploy", {
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
    },
    stdio: "inherit",
  });
}



export async function resetUserData() {
  await testPrisma.auditLog.deleteMany();
  await testPrisma.gradeCorrectionRequest.deleteMany();
  await testPrisma.gradeScaleItem.deleteMany();
  await testPrisma.gradeScale.deleteMany();
  await testPrisma.reportCardItem.deleteMany();
  await testPrisma.reportCard.deleteMany();
  await testPrisma.assessmentResult.deleteMany();
  await testPrisma.assessment.deleteMany();
  await testPrisma.attendance.deleteMany();
  await testPrisma.attendanceSession.deleteMany();
  await testPrisma.lesson.deleteMany();
  await testPrisma.timetableVersion.deleteMany();
  await testPrisma.teacherAssignment.deleteMany();
  await testPrisma.classSubject.deleteMany();
  await testPrisma.classModule.deleteMany();
  await testPrisma.enrollment.deleteMany();
  await testPrisma.invoiceDiscount.deleteMany();
  await testPrisma.payment.deleteMany();
  await testPrisma.receipt.deleteMany();
  await testPrisma.invoiceItem.deleteMany();
  await testPrisma.invoice.deleteMany();
  await testPrisma.scholarship.deleteMany();
  await testPrisma.feeStructure.deleteMany();
  await testPrisma.parentStudent.deleteMany();
  await testPrisma.student.deleteMany();
  await testPrisma.parent.deleteMany();
  await testPrisma.teacher.deleteMany();
  await testPrisma.staffProfile.deleteMany();
  await testPrisma.class.deleteMany();
  await testPrisma.pathway.deleteMany();
  await testPrisma.subjectLevel.deleteMany();
  await testPrisma.subject.deleteMany();
  await testPrisma.module.deleteMany();
  await testPrisma.trade.deleteMany();
  await testPrisma.holiday.deleteMany();
  await testPrisma.term.deleteMany();
  await testPrisma.academicYear.deleteMany();
  await testPrisma.educationLevel.deleteMany();
  await testPrisma.announcement.deleteMany();
  await testPrisma.notification.deleteMany();
  await testPrisma.userRole.deleteMany();
  await testPrisma.user.deleteMany();
  await testPrisma.file.deleteMany();
  await testPrisma.schoolInfo.deleteMany();
}