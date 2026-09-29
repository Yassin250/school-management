-- ============================================================
-- Migration: add_grade_workflow_fields
-- Adds review/return/lock tracking to Assessment,
-- adds the GradeCorrectionRequest model,
-- adds regeneration tracking to ReportCard.
-- ============================================================

-- CreateEnum
CREATE TYPE "CorrectionStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'REJECTED', 'COMPLETED');

-- AlterTable: Assessment — review tracking
ALTER TABLE "assessments" ADD COLUMN "reviewedById" TEXT;

-- AlterTable: Assessment — return tracking
ALTER TABLE "assessments" ADD COLUMN "returnedAt" TIMESTAMP(3);
ALTER TABLE "assessments" ADD COLUMN "returnedById" TEXT;
ALTER TABLE "assessments" ADD COLUMN "returnedReason" TEXT;

-- AlterTable: Assessment — lock tracking
ALTER TABLE "assessments" ADD COLUMN "lockedAt" TIMESTAMP(3);
ALTER TABLE "assessments" ADD COLUMN "lockedById" TEXT;

-- AlterTable: ReportCard — regeneration tracking
ALTER TABLE "report_cards" ADD COLUMN "needsRegeneration" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "report_cards" ADD COLUMN "regenerationReason" TEXT;

-- CreateTable: GradeCorrectionRequest
CREATE TABLE "grade_correction_requests" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "affectedStudentIds" TEXT[],
    "status" "CorrectionStatus" NOT NULL DEFAULT 'PENDING',
    "authorizedById" TEXT,
    "authorizedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "grade_correction_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assessments_status_idx" ON "assessments"("status");

-- CreateIndex
CREATE INDEX "grade_correction_requests_assessmentId_status_idx" ON "grade_correction_requests"("assessmentId", "status");

-- CreateIndex
CREATE INDEX "grade_correction_requests_status_idx" ON "grade_correction_requests"("status");

-- CreateIndex
CREATE INDEX "report_cards_needsRegeneration_idx" ON "report_cards"("needsRegeneration");

-- AddForeignKey: Assessment review/return/lock
ALTER TABLE "assessments"
  ADD CONSTRAINT "assessments_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "assessments"
  ADD CONSTRAINT "assessments_returnedById_fkey"
  FOREIGN KEY ("returnedById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "assessments"
  ADD CONSTRAINT "assessments_lockedById_fkey"
  FOREIGN KEY ("lockedById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: GradeCorrectionRequest
ALTER TABLE "grade_correction_requests"
  ADD CONSTRAINT "grade_correction_requests_assessmentId_fkey"
  FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "grade_correction_requests"
  ADD CONSTRAINT "grade_correction_requests_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "grade_correction_requests"
  ADD CONSTRAINT "grade_correction_requests_authorizedById_fkey"
  FOREIGN KEY ("authorizedById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "grade_correction_requests"
  ADD CONSTRAINT "grade_correction_requests_rejectedById_fkey"
  FOREIGN KEY ("rejectedById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- CHECK constraints (appended manually — Prisma cannot express)
-- ============================================================

ALTER TABLE "grade_correction_requests"
  ADD CONSTRAINT "correction_reason_not_empty"
  CHECK (length(trim("reason")) > 0);

ALTER TABLE "grade_correction_requests"
  ADD CONSTRAINT "correction_status_consistency"
  CHECK (
    (status = 'PENDING'    AND "authorizedAt" IS NULL AND "rejectedAt" IS NULL) OR
    (status = 'AUTHORIZED' AND "authorizedAt" IS NOT NULL AND "rejectedAt" IS NULL) OR
    (status = 'REJECTED'   AND "rejectedAt" IS NOT NULL AND "rejectionReason" IS NOT NULL) OR
    (status = 'COMPLETED'  AND "completedAt" IS NOT NULL)
  );