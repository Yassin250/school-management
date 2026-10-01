// ============================================================
// Teacher Assessments Service
// ============================================================
// List + create assessments for a teacher in a class.
// Only the teacher's assigned subjects in the class can be used.
// ============================================================

import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { logAudit } from "@/lib/audit/audit";
import type { CurrentUser } from "@/lib/auth/session";
import type { AssessmentType } from "@prisma/client";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface AssessmentListItem {
  id: string;
  title: string;
  type: AssessmentType;
  status: string;
  subjectId: string | null;
  subjectName: string | null;
  moduleId: string | null;
  moduleName: string | null;
  maxScore: string;
  weight: string | null;
  assessmentDate: Date | null;
  createdAt: Date;
}

export interface TeacherSubjectOption {
  subjectId: string | null;
  moduleId: string | null;
  label: string;
}

export interface CreateAssessmentInput {
  classId: string;
  subjectId?: string | null;
  moduleId?: string | null;
  title: string;
  type: AssessmentType;
  maxScore: number;
  weight?: number | null;
  assessmentDate?: Date | null;
}

// ------------------------------------------------------------
// listAssessmentsForClass
// ------------------------------------------------------------

export async function listAssessmentsForClass(
  actor: CurrentUser,
  classId: string,
): Promise<AssessmentListItem[]> {
  const allowed = await canForUser(actor, "assessments.read", {
    type: "class",
    classId,
  });
  if (!allowed) throw new ForbiddenError("assessments.read");
  if (!actor.teacherId) return [];

  const currentYear = await prisma.academicYear.findFirst({
    where: { isCurrent: true },
    select: { id: true },
  });
  if (!currentYear) return [];

  // Get the teacher's assigned subject IDs in this class
  const assignments = await prisma.teacherAssignment.findMany({
    where: {
      teacherId: actor.teacherId,
      classId,
      academicYearId: currentYear.id,
    },
    select: { subjectId: true, moduleId: true },
  });

  const subjectIds = assignments
    .map((a) => a.subjectId)
    .filter((s): s is string => Boolean(s));
  const moduleIds = assignments
    .map((a) => a.moduleId)
    .filter((m): m is string => Boolean(m));

  if (subjectIds.length === 0 && moduleIds.length === 0) return [];

  const assessments = await prisma.assessment.findMany({
    where: {
      classId,
      teacherId: actor.teacherId,
      OR: [
        { subjectId: { in: subjectIds } },
        { moduleId: { in: moduleIds } },
      ],
    },
    include: {
      subject: { select: { id: true, name: true } },
      module: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return assessments.map((a) => ({
    id: a.id,
    title: a.title,
    type: a.type,
    status: a.status,
    subjectId: a.subjectId,
    subjectName: a.subject?.name ?? null,
    moduleId: a.moduleId,
    moduleName: a.module?.name ?? null,
    maxScore: a.maxScore.toString(),
    weight: a.weight?.toString() ?? null,
    assessmentDate: a.assessmentDate,
    createdAt: a.createdAt,
  }));
}

// ------------------------------------------------------------
// getTeacherSubjectsForClass
// ------------------------------------------------------------

export async function getTeacherSubjectsForClass(
  actor: CurrentUser,
  classId: string,
): Promise<TeacherSubjectOption[]> {
  if (!actor.teacherId) return [];

  const currentYear = await prisma.academicYear.findFirst({
    where: { isCurrent: true },
    select: { id: true },
  });
  if (!currentYear) return [];

  const assignments = await prisma.teacherAssignment.findMany({
    where: {
      teacherId: actor.teacherId,
      classId,
      academicYearId: currentYear.id,
    },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      module: { select: { id: true, name: true, code: true } },
    },
    orderBy: [{ subject: { name: "asc" } }, { module: { name: "asc" } }],
  });

  return assignments.map((a) => ({
    subjectId: a.subject?.id ?? null,
    moduleId: a.module?.id ?? null,
    label: a.subject?.name ?? a.module?.name ?? "Unknown",
  }));
}

// ------------------------------------------------------------
// createAssessment
// ------------------------------------------------------------

export async function createAssessment(
  actor: CurrentUser,
  input: CreateAssessmentInput,
): Promise<{ id: string }> {
  const { classId, subjectId, moduleId, title, type, maxScore, weight, assessmentDate } = input;

  // Permission + scope
  const allowed = await canForUser(actor, "assessments.create", {
    type: "class",
    classId,
  });
  if (!allowed) throw new ForbiddenError("assessments.create");
  if (!actor.teacherId) throw new ForbiddenError("assessments.create");

  // Validate subject belongs to teacher's assignments in this class
  const currentYear = await prisma.academicYear.findFirst({
    where: { isCurrent: true },
    select: { id: true },
  });
  if (!currentYear) {
    throw new ValidationError("No current academic year configured.");
  }

  if (!subjectId && !moduleId) {
    throw new ValidationError("Either a subject or a module must be selected.");
  }

  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId: actor.teacherId,
      classId,
      academicYearId: currentYear.id,
      OR: [
        ...(subjectId ? [{ subjectId }] : []),
        ...(moduleId ? [{ moduleId }] : []),
      ],
    },
  });
  if (!assignment) {
    throw new ValidationError(
      "You are not assigned to teach this subject in this class.",
    );
  }

  // Validate term
  const term = await prisma.term.findFirst({
    where: { isCurrent: true },
    select: { id: true },
  });
  if (!term) {
    throw new ValidationError("No current term configured.");
  }

  // Validate maxScore
  if (!Number.isFinite(maxScore) || maxScore <= 0) {
    throw new ValidationError("Max score must be a positive number.");
  }

  // Validate weight
  if (weight != null && (weight < 0 || weight > 100)) {
    throw new ValidationError("Weight must be between 0 and 100.");
  }

  // Validate title
  const trimmedTitle = title.trim();
  if (trimmedTitle.length < 2) {
    throw new ValidationError("Title must be at least 2 characters.");
  }

  // Transaction: create + audit
  const now = new Date();

  const created = await prisma.$transaction(async (tx) => {
    const assessment = await tx.assessment.create({
      data: {
        title: trimmedTitle,
        type,
        termId: term.id,
        classId,
        subjectId: subjectId ?? null,
        moduleId: moduleId ?? null,
        teacherId: actor.teacherId!,
        maxScore,
        weight: weight ?? null,
        assessmentDate: assessmentDate ?? null,
        status: "DRAFT",
      },
    });

    await logAudit({
      actorId: actor.id,
      action: "ASSESSMENT_CREATED",
      entity: "Assessment",
      entityId: assessment.id,
      description: `Created assessment "${trimmedTitle}"`,
      newValue: {
        title: trimmedTitle,
        type,
        classId,
        subjectId,
        moduleId,
        maxScore,
        weight,
        status: "DRAFT",
      },
      tx,
    });

    return assessment;
  });

  return { id: created.id };
}