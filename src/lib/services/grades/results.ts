// ============================================================
// Grade Results Service
// ============================================================
// Result-level CRUD: enter marks, edit marks, mark absent.
//
// Rules:
//   - Results can only be modified when the assessment status
//     is DRAFT or RETURNED.
//   - Each student has exactly one result per assessment.
//   - A score must be within [0, maxScore] when not absent.
//   - An absent result must have a null score.
// ============================================================

import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { logAudit } from "@/lib/audit/audit";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";

// ============================================================
// Editable-state guard
// ============================================================

const EDITABLE_STATUSES = ["DRAFT", "RETURNED"] as const;

function assertEditable(status: string) {
  if (!EDITABLE_STATUSES.includes(status as (typeof EDITABLE_STATUSES)[number])) {
    throw new ConflictError(
      `Cannot modify results: assessment is in state ${status}. ` +
        `Results can only be edited in DRAFT or RETURNED states.`,
    );
  }
}

// ============================================================
// Load assessment with results
// ============================================================

async function loadAssessment(assessmentId: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: {
      id: true,
      classId: true,
      status: true,
      maxScore: true,
      teacherId: true,
    },
  });

  if (!assessment) {
    throw new NotFoundError("Assessment", assessmentId);
  }

  return assessment;
}

// ============================================================
// Enter / update a single result
// ============================================================

export interface EnterResultInput {
  assessmentId: string;
  studentId: string;
  score: number | null;
  isAbsent: boolean;
  note?: string;
  actor: CurrentUser;
}

export async function enterResult(input: EnterResultInput) {
  const { assessmentId, studentId, score, isAbsent, note, actor } = input;

  // 1. Load assessment + permission + scope
  const assessment = await loadAssessment(assessmentId);
  assertEditable(assessment.status);

  const allowed = await canForUser(actor, "grades.enter", {
    type: "assessment",
    assessmentId,
  });
  if (!allowed) throw new ForbiddenError("grades.enter");

  // 2. Validate input
  validateScoreInput(score, isAbsent, assessment.maxScore);

  // 3. Verify the student is enrolled in the assessment's class
  await verifyStudentInClass(studentId, assessment.classId);

  // 4. Upsert the result + audit log in a transaction
  const existing = await prisma.assessmentResult.findUnique({
    where: {
      assessmentId_studentId: { assessmentId, studentId },
    },
  });

  return prisma.$transaction(async (tx) => {
    const result = existing
      ? await tx.assessmentResult.update({
          where: { id: existing.id },
          data: {
            score,
            isAbsent,
            note: note ?? null,
            enteredById: actor.id,
            enteredAt: new Date(),
          },
        })
      : await tx.assessmentResult.create({
          data: {
            assessmentId,
            studentId,
            score,
            isAbsent,
            note: note ?? null,
            enteredById: actor.id,
          },
        });

    await logAudit({
      actorId: actor.id,
      action: existing ? "GRADE_UPDATED" : "GRADE_ENTERED",
      entity: "AssessmentResult",
      entityId: result.id,
      previousValue: existing
        ? {
            score: existing.score?.toString() ?? null,
            isAbsent: existing.isAbsent,
            note: existing.note,
          }
        : null,
      newValue: {
        score: score?.toString() ?? null,
        isAbsent,
        note: note ?? null,
        assessmentId,
        studentId,
      },
      tx,
    });

    return result;
  });
}

// ============================================================
// Bulk enter results
// ============================================================

export interface BulkEnterResultInput {
  assessmentId: string;
  results: Array<{
    studentId: string;
    score: number | null;
    isAbsent: boolean;
    note?: string;
  }>;
  actor: CurrentUser;
}

/**
 * Enter or update many results in one transaction.
 * Useful for bulk mark entry from the UI.
 */
export async function enterResultsBulk(input: BulkEnterResultInput) {
  const { assessmentId, results, actor } = input;

  if (results.length === 0) {
    throw new ValidationError("No results provided.");
  }

  // 1. Load assessment + permission + scope
  const assessment = await loadAssessment(assessmentId);
  assertEditable(assessment.status);

  const allowed = await canForUser(actor, "grades.enter", {
    type: "assessment",
    assessmentId,
  });
  if (!allowed) throw new ForbiddenError("grades.enter");

  // 2. Validate all inputs
  for (const r of results) {
    validateScoreInput(r.score, r.isAbsent, assessment.maxScore);
  }

  // 3. Verify all students are in this class (single query)
  const studentIds = [...new Set(results.map((r) => r.studentId))];
  await verifyStudentsInClass(studentIds, assessment.classId);

  // 4. Load existing results for these students
  const existing = await prisma.assessmentResult.findMany({
    where: {
      assessmentId,
      studentId: { in: studentIds },
    },
  });
  const existingByStudent = new Map(
    existing.map((e) => [e.studentId, e]),
  );

  // 5. Transaction: upsert all + audit log
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const saved: Awaited<ReturnType<typeof tx.assessmentResult.create>>[] = [];
    const changes: Array<{
      studentId: string;
      previous: {
        score: string | null;
        isAbsent: boolean;
        note: string | null;
      } | null;
      current: {
        score: string | null;
        isAbsent: boolean;
        note: string | null;
      };
    }> = [];

    for (const r of results) {
      const prior = existingByStudent.get(r.studentId);

      const result = prior
        ? await tx.assessmentResult.update({
            where: { id: prior.id },
            data: {
              score: r.score,
              isAbsent: r.isAbsent,
              note: r.note ?? null,
              enteredById: actor.id,
              enteredAt: now,
            },
          })
        : await tx.assessmentResult.create({
            data: {
              assessmentId,
              studentId: r.studentId,
              score: r.score,
              isAbsent: r.isAbsent,
              note: r.note ?? null,
              enteredById: actor.id,
            },
          });

      const current = {
        score: result.score?.toString() ?? null,
        isAbsent: result.isAbsent,
        note: result.note,
      };

      // Record every result that was created or actually changed, so a
      // re-submitted identical sheet does not fabricate audit noise but
      // a real mark change always leaves a before/after trail.
      const previous = prior
        ? {
            score: prior.score?.toString() ?? null,
            isAbsent: prior.isAbsent,
            note: prior.note,
          }
        : null;

      const changed =
        previous === null ||
        previous.score !== current.score ||
        previous.isAbsent !== current.isAbsent ||
        previous.note !== current.note;

      if (changed) {
        changes.push({ studentId: r.studentId, previous, current });
      }

      saved.push(result);
    }

    if (changes.length > 0) {
      await logAudit({
        actorId: actor.id,
        action: "GRADE_UPDATED",
        entity: "Assessment",
        entityId: assessmentId,
        description: `Updated ${changes.length} of ${results.length} result(s)`,
        newValue: {
          count: changes.length,
          submittedCount: results.length,
          changes,
        },
        tx,
      });
    }

    return saved;
  });
}

// ============================================================
// Delete a single result
// ============================================================

export async function deleteResult(
  assessmentId: string,
  studentId: string,
  actor: CurrentUser,
) {
  const assessment = await loadAssessment(assessmentId);
  assertEditable(assessment.status);

  const allowed = await canForUser(actor, "grades.enter", {
    type: "assessment",
    assessmentId,
  });
  if (!allowed) throw new ForbiddenError("grades.enter");

  const existing = await prisma.assessmentResult.findUnique({
    where: {
      assessmentId_studentId: { assessmentId, studentId },
    },
  });

  if (!existing) {
    throw new NotFoundError(
      "AssessmentResult",
      `${assessmentId}/${studentId}`,
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.assessmentResult.delete({ where: { id: existing.id } });

    await logAudit({
      actorId: actor.id,
      action: "GRADE_UPDATED",
      entity: "AssessmentResult",
      entityId: existing.id,
      description: `Deleted result for student ${studentId}`,
      previousValue: {
        score: existing.score?.toString() ?? null,
        isAbsent: existing.isAbsent,
      },
      tx,
    });
  });
}

// ============================================================
// Load results for an assessment
// ============================================================

/**
 * Returns all results for an assessment.
 * Scope: whoever can read the assessment can read its results.
 */
export async function listResults(
  assessmentId: string,
  actor: CurrentUser,
) {
  const allowed = await canForUser(actor, "grades.read", {
    type: "assessment",
    assessmentId,
  });
  if (!allowed) throw new ForbiddenError("grades.read");

  return prisma.assessmentResult.findMany({
    where: { assessmentId },
    include: {
      student: {
        select: {
          id: true,
          studentCode: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { student: { lastName: "asc" } },
  });
}

// ============================================================
// Validation helpers
// ============================================================

function validateScoreInput(
  score: number | null,
  isAbsent: boolean,
  maxScore: { toString(): string },
) {
  const maxNum = Number(maxScore.toString());

  if (isAbsent) {
    if (score !== null && score !== undefined) {
      throw new ValidationError(
        "An absent student must have a null score.",
      );
    }
    return;
  }

  // Not absent, allow null (partial save)
  if (score === null || score === undefined) {
    return;
  }

  if (typeof score !== "number" || Number.isNaN(score)) {
    throw new ValidationError("Score must be a number.");
  }

  if (score < 0 || score > maxNum) {
    throw new ValidationError(
      `Score must be between 0 and ${maxNum}. Got ${score}.`,
    );
  }
}

// ============================================================
// Enrollment verification
// ============================================================

async function verifyStudentInClass(
  studentId: string,
  classId: string,
): Promise<void> {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      classId,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (!enrollment) {
    throw new ValidationError(
      `Student ${studentId} is not actively enrolled in class ${classId}.`,
    );
  }
}

async function verifyStudentsInClass(
  studentIds: string[],
  classId: string,
): Promise<void> {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: { in: studentIds },
      classId,
      status: "ACTIVE",
    },
    select: { studentId: true },
  });

  const found = new Set(enrollments.map((e) => e.studentId));
  const missing = studentIds.filter((id) => !found.has(id));

  if (missing.length > 0) {
    throw new ValidationError(
      `${missing.length} student(s) are not actively enrolled in this class: ` +
        missing.slice(0, 5).join(", ") +
        (missing.length > 5 ? ", ..." : ""),
    );
  }
}