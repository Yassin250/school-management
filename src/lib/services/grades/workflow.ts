// ============================================================
// Grade Workflow Service
// ============================================================
// Single entry point for every assessment state transition.
// No other code should mutate Assessment.status directly.
//
// Permission checks receive an explicit `actor: CurrentUser`
// instead of loading the current user internally. This makes
// the service testable and lets server actions control the
// session boundary.
//
// See: docs/grade-workflow.md
// ============================================================

import type { AssessmentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import type { ResourceContext } from "@/lib/permissions/can";
import { logAudit, type AuditAction } from "@/lib/audit/audit";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";

// ============================================================
// Transition definitions
// ============================================================

type PermissionKey =
  | "grades.submit"
  | "grades.review"
  | "grades.approve"
  | "grades.return"
  | "grades.edit"
  | "grades.request_correction"
  | "grades.authorize_correction"
  | "grades.cancel_correction"
  | "grades.lock"
  | "grades.request_post_lock_correction";

interface TransitionDef {
  from: AssessmentStatus[];
  to: AssessmentStatus;
  permission: PermissionKey;
  auditAction: AuditAction;
  requiresReason: boolean;
}

const TRANSITIONS: Record<string, TransitionDef> = {
  SUBMIT: {
    from: ["DRAFT"],
    to: "SUBMITTED",
    permission: "grades.submit",
    auditAction: "ASSESSMENT_SUBMITTED",
    requiresReason: false,
  },
  START_REVIEW: {
    from: ["SUBMITTED"],
    to: "UNDER_REVIEW",
    permission: "grades.review",
    auditAction: "ASSESSMENT_REVIEW_STARTED",
    requiresReason: false,
  },
  APPROVE: {
    from: ["UNDER_REVIEW"],
    to: "APPROVED",
    permission: "grades.approve",
    auditAction: "ASSESSMENT_APPROVED",
    requiresReason: false,
  },
  RETURN: {
    from: ["UNDER_REVIEW"],
    to: "RETURNED",
    permission: "grades.return",
    auditAction: "ASSESSMENT_RETURNED",
    requiresReason: true,
  },
  REOPEN_AFTER_RETURN: {
    from: ["RETURNED"],
    to: "DRAFT",
    permission: "grades.edit",
    auditAction: "ASSESSMENT_UPDATED",
    requiresReason: false,
  },
  REQUEST_CORRECTION: {
    from: ["APPROVED"],
    to: "CORRECTION_PENDING",
    permission: "grades.request_correction",
    auditAction: "GRADE_CORRECTION_REQUESTED",
    requiresReason: true,
  },
  AUTHORIZE_CORRECTION: {
    from: ["CORRECTION_PENDING"],
    to: "DRAFT",
    permission: "grades.authorize_correction",
    auditAction: "GRADE_CORRECTION_AUTHORIZED",
    requiresReason: false,
  },
  CANCEL_CORRECTION: {
    from: ["CORRECTION_PENDING"],
    to: "LOCKED",
    permission: "grades.cancel_correction",
    auditAction: "GRADE_CORRECTION_REJECTED",
    requiresReason: true,
  },
  LOCK: {
    from: ["APPROVED"],
    to: "LOCKED",
    permission: "grades.lock",
    auditAction: "ASSESSMENT_LOCKED",
    requiresReason: false,
  },
  REQUEST_POST_LOCK_CORRECTION: {
    from: ["LOCKED"],
    to: "CORRECTION_PENDING",
    permission: "grades.request_post_lock_correction",
    auditAction: "GRADE_CORRECTION_REQUESTED",
    requiresReason: true,
  },
};

export type TransitionName = keyof typeof TRANSITIONS;

// ============================================================
// Central transition function
// ============================================================

export interface TransitionParams {
  assessmentId: string;
  transition: TransitionName;
  actor: CurrentUser;
  reason?: string;
  description?: string;
  affectedStudentIds?: string[];
}

export async function transitionAssessment(params: TransitionParams) {
  const {
    assessmentId,
    transition,
    actor,
    reason,
    description,
    affectedStudentIds,
  } = params;

  const def = TRANSITIONS[transition];
  if (!def) {
    throw new ValidationError(`Unknown transition: ${transition}`);
  }

  // 1. Load assessment
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      results: {
        select: {
          id: true,
          studentId: true,
          score: true,
          isAbsent: true,
        },
      },
    },
  });

  if (!assessment) {
    throw new NotFoundError("Assessment", assessmentId);
  }

  // 2. Verify current state
  if (!def.from.includes(assessment.status)) {
    throw new ConflictError(
      `Cannot perform ${transition} on assessment in state ${assessment.status}. ` +
        `Allowed states: ${def.from.join(", ")}.`,
    );
  }

  // 3. Verify permission + scope using the provided actor
  const context: ResourceContext = {
    type: "assessment",
    assessmentId,
  };
  const allowed = await canForUser(actor, def.permission, context);
  if (!allowed) {
    throw new ForbiddenError(def.permission);
  }

  // 4. Preconditions per transition
  await checkPreconditions(transition, assessment, {
    reason,
    description,
    affectedStudentIds,
  });

  // 5. Transaction: update + audit
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const data: Prisma.AssessmentUpdateInput = { status: def.to };

    switch (transition) {
      case "SUBMIT":
        data.submittedAt = now;
        break;
      case "START_REVIEW":
        data.reviewedAt = now;
        data.reviewedBy = { connect: { id: actor.id } };
        break;
      case "APPROVE":
        data.approvedAt = now;
        data.approvedBy = { connect: { id: actor.id } };
        break;
      case "RETURN":
        data.returnedAt = now;
        data.returnedBy = { connect: { id: actor.id } };
        data.returnedReason = reason ?? null;
        break;
      case "REOPEN_AFTER_RETURN":
        break;
      case "REQUEST_CORRECTION":
      case "REQUEST_POST_LOCK_CORRECTION":
        await tx.gradeCorrectionRequest.create({
          data: {
            assessmentId: assessment.id,
            requestedById: actor.id,
            reason: reason!,
            description: description ?? null,
            affectedStudentIds: affectedStudentIds ?? [],
            status: "PENDING",
          },
        });
        break;
      case "AUTHORIZE_CORRECTION": {
        const pending = await tx.gradeCorrectionRequest.findFirst({
          where: { assessmentId: assessment.id, status: "PENDING" },
          orderBy: { requestedAt: "desc" },
        });
        if (!pending) {
          throw new ConflictError(
            "No pending correction request found for this assessment.",
          );
        }
        await tx.gradeCorrectionRequest.update({
          where: { id: pending.id },
          data: {
            status: "AUTHORIZED",
            authorizedById: actor.id,
            authorizedAt: now,
          },
        });
        break;
      }
      case "CANCEL_CORRECTION": {
        const pending = await tx.gradeCorrectionRequest.findFirst({
          where: { assessmentId: assessment.id, status: "PENDING" },
          orderBy: { requestedAt: "desc" },
        });
        if (!pending) {
          throw new ConflictError(
            "No pending correction request found for this assessment.",
          );
        }
        await tx.gradeCorrectionRequest.update({
          where: { id: pending.id },
          data: {
            status: "REJECTED",
            rejectedById: actor.id,
            rejectedAt: now,
            rejectionReason: reason ?? null,
          },
        });
        break;
      }
      case "LOCK":
        data.lockedAt = now;
        data.lockedBy = { connect: { id: actor.id } };
        break;
    }

    const result = await tx.assessment.update({
      where: { id: assessment.id },
      data,
      include: {
        results: true,
        correctionRequests: true,
      },
    });

    await logAudit({
      actorId: actor.id,
      action: def.auditAction,
      entity: "Assessment",
      entityId: assessment.id,
      previousValue: { status: assessment.status },
      newValue: {
        status: def.to,
        ...(reason ? { reason } : {}),
        ...(description ? { description } : {}),
        ...(affectedStudentIds ? { affectedStudentIds } : {}),
      },
      tx,
    });

    return result;
  });

  return updated;
}

// ============================================================
// Preconditions
// ============================================================

interface PreconditionInput {
  reason?: string;
  description?: string;
  affectedStudentIds?: string[];
}

async function checkPreconditions(
  transition: TransitionName,
  assessment: {
    id: string;
    classId: string;
    maxScore: Prisma.Decimal;
    results: Array<{
      id: string;
      studentId: string;
      score: Prisma.Decimal | null;
      isAbsent: boolean;
    }>;
  },
  input: PreconditionInput,
): Promise<void> {
  const def = TRANSITIONS[transition];

  if (def.requiresReason) {
    if (!input.reason || input.reason.trim().length < 5) {
      throw new ValidationError(
        `A reason of at least 5 characters is required for ${transition}.`,
      );
    }
  }

  if (
    transition === "REQUEST_CORRECTION" ||
    transition === "REQUEST_POST_LOCK_CORRECTION"
  ) {
    if (
      !input.affectedStudentIds ||
      input.affectedStudentIds.length === 0
    ) {
      throw new ValidationError(
        "At least one affected student must be specified for a correction request.",
      );
    }

    // The design contract (docs/grade-workflow.md §10) requires a
    // description alongside the reason: the reason states what is wrong,
    // the description states what must change.
    if (!input.description || input.description.trim().length < 5) {
      throw new ValidationError(
        `A description of at least 5 characters is required for ${transition}.`,
      );
    }

    await verifyAffectedStudents(
      assessment.classId,
      input.affectedStudentIds,
    );
  }

  if (transition === "SUBMIT") {
    await checkSubmissionReadiness(assessment);
  }
}

// ============================================================
// Correction request validation
// ============================================================

/**
 * Every affected student must be actively enrolled in the assessment's
 * own class. Naming a student from elsewhere would record a correction
 * request against results that cannot exist, and would let a requester
 * probe for students outside their scope.
 */
async function verifyAffectedStudents(
  classId: string,
  affectedStudentIds: string[],
): Promise<void> {
  const uniqueIds = [...new Set(affectedStudentIds)];

  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId,
      status: "ACTIVE",
      studentId: { in: uniqueIds },
    },
    select: { studentId: true },
  });

  const enrolled = new Set(enrollments.map((e) => e.studentId));
  const invalid = uniqueIds.filter((id) => !enrolled.has(id));

  if (invalid.length > 0) {
    throw new ValidationError(
      `${invalid.length} affected student(s) are not actively enrolled in ` +
        `this assessment's class.`,
      invalid.map((studentId) => ({
        path: "affectedStudentIds",
        message: `Student ${studentId} is not actively enrolled in class ${classId}.`,
      })),
    );
  }
}

// ============================================================
// Submission readiness
// ============================================================

async function checkSubmissionReadiness(assessment: {
  id: string;
  classId: string;
  maxScore: Prisma.Decimal;
  results: Array<{
    id: string;
    studentId: string;
    score: Prisma.Decimal | null;
    isAbsent: boolean;
  }>;
}): Promise<void> {
  if (assessment.results.length === 0) {
    throw new ValidationError(
      "Cannot submit an assessment with no results recorded.",
    );
  }

  const enrolled = await prisma.enrollment.findMany({
    where: {
      classId: assessment.classId,
      status: "ACTIVE",
    },
    select: { studentId: true },
  });

  const enrolledIds = new Set(enrolled.map((e) => e.studentId));
  const resultStudentIds = new Set(
    assessment.results.map((r) => r.studentId),
  );

  const missing: string[] = [];
  for (const studentId of enrolledIds) {
    if (!resultStudentIds.has(studentId)) {
      missing.push(studentId);
    }
  }
  if (missing.length > 0) {
    throw new ValidationError(
      `Cannot submit: ${missing.length} enrolled student(s) have no result. ` +
        `Missing student IDs: ${missing.slice(0, 5).join(", ")}${
          missing.length > 5 ? ", ..." : ""
        }`,
    );
  }

  const maxScore = Number(assessment.maxScore);
  const issues: string[] = [];

  for (const result of assessment.results) {
    if (result.isAbsent) {
      if (result.score !== null) {
        issues.push(
          `Student ${result.studentId} is marked absent but has a score.`,
        );
      }
      continue;
    }

    if (result.score === null) {
      issues.push(
        `Student ${result.studentId} is not marked absent but has no score.`,
      );
      continue;
    }

    const scoreNum = Number(result.score);
    if (scoreNum < 0 || scoreNum > maxScore) {
      issues.push(
        `Student ${result.studentId} has score ${scoreNum} outside valid range 0..${maxScore}.`,
      );
    }
  }

  if (issues.length > 0) {
    throw new ValidationError(
      `Cannot submit: ${issues.length} result(s) are invalid.`,
      issues.map((msg) => ({ path: "results", message: msg })),
    );
  }
}

// ============================================================
// Convenience wrappers
// ============================================================

export async function submitAssessment(
  assessmentId: string,
  actor: CurrentUser,
) {
  return transitionAssessment({
    assessmentId,
    transition: "SUBMIT",
    actor,
  });
}

export async function startReview(
  assessmentId: string,
  actor: CurrentUser,
) {
  return transitionAssessment({
    assessmentId,
    transition: "START_REVIEW",
    actor,
  });
}

export async function approveAssessment(
  assessmentId: string,
  actor: CurrentUser,
) {
  return transitionAssessment({
    assessmentId,
    transition: "APPROVE",
    actor,
  });
}

export async function returnAssessment(
  assessmentId: string,
  reason: string,
  actor: CurrentUser,
) {
  return transitionAssessment({
    assessmentId,
    transition: "RETURN",
    actor,
    reason,
  });
}

export async function reopenReturnedAssessment(
  assessmentId: string,
  actor: CurrentUser,
) {
  return transitionAssessment({
    assessmentId,
    transition: "REOPEN_AFTER_RETURN",
    actor,
  });
}

export interface RequestCorrectionInput {
  assessmentId: string;
  reason: string;
  description: string;
  affectedStudentIds: string[];
  actor: CurrentUser;
}

export async function requestCorrection(input: RequestCorrectionInput) {
  const { assessmentId, reason, description, affectedStudentIds, actor } =
    input;

  return transitionAssessment({
    assessmentId,
    transition: "REQUEST_CORRECTION",
    actor,
    reason,
    description,
    affectedStudentIds,
  });
}

export async function authorizeCorrection(
  assessmentId: string,
  actor: CurrentUser,
) {
  return transitionAssessment({
    assessmentId,
    transition: "AUTHORIZE_CORRECTION",
    actor,
  });
}

export async function cancelCorrection(
  assessmentId: string,
  reason: string,
  actor: CurrentUser,
) {
  return transitionAssessment({
    assessmentId,
    transition: "CANCEL_CORRECTION",
    actor,
    reason,
  });
}

export async function lockAssessment(
  assessmentId: string,
  actor: CurrentUser,
) {
  return transitionAssessment({
    assessmentId,
    transition: "LOCK",
    actor,
  });
}

export interface RequestPostLockCorrectionInput {
  assessmentId: string;
  reason: string;
  description: string;
  affectedStudentIds: string[];
  actor: CurrentUser;
}

export async function requestPostLockCorrection(
  input: RequestPostLockCorrectionInput,
) {
  const { assessmentId, reason, description, affectedStudentIds, actor } =
    input;

  return transitionAssessment({
    assessmentId,
    transition: "REQUEST_POST_LOCK_CORRECTION",
    actor,
    reason,
    description,
    affectedStudentIds,
  });
}