CREATE TYPE "AttendanceSessionStatus" AS ENUM ('DRAFT', 'RECORDED', 'FINALIZED');
CREATE TYPE "AttendanceCorrectionStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'APPLIED');

CREATE TABLE "attendance_sessions" (
  "id" TEXT NOT NULL,
  "academicYearId" TEXT NOT NULL,
  "termId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "sessionDate" TIMESTAMP(3) NOT NULL,
  "status" "AttendanceSessionStatus" NOT NULL DEFAULT 'DRAFT',
  "createdById" TEXT NOT NULL,
  "finalizedAt" TIMESTAMP(3),
  "finalizedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "attendances" ADD COLUMN "sessionId" TEXT;
DROP INDEX "attendances_studentId_lessonId_key";
CREATE UNIQUE INDEX "attendance_sessions_lessonId_sessionDate_key" ON "attendance_sessions"("lessonId", "sessionDate");
CREATE INDEX "attendance_sessions_classId_sessionDate_idx" ON "attendance_sessions"("classId", "sessionDate");
CREATE INDEX "attendance_sessions_teacherId_sessionDate_idx" ON "attendance_sessions"("teacherId", "sessionDate");
CREATE UNIQUE INDEX "attendances_sessionId_studentId_key" ON "attendances"("sessionId", "studentId");
CREATE INDEX "attendances_sessionId_idx" ON "attendances"("sessionId");

ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_finalizedById_fkey" FOREIGN KEY ("finalizedById") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "attendance_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "attendance_corrections" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "attendanceId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "previousValue" JSONB NOT NULL,
  "proposedValue" JSONB NOT NULL,
  "status" "AttendanceCorrectionStatus" NOT NULL DEFAULT 'REQUESTED',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "appliedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attendance_corrections_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "attendance_corrections_sessionId_status_idx" ON "attendance_corrections"("sessionId", "status");
CREATE INDEX "attendance_corrections_attendanceId_idx" ON "attendance_corrections"("attendanceId");
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "attendances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
