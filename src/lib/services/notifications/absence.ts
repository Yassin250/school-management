// ============================================================
// Absence Notification Service
// ============================================================
// Called inside saveAttendance's transaction.
//
// createAbsenceNotifications(tx, input)
//   - For each student who transitioned INTO "ABSENT", find every
//     linked parent User, and create an IN_APP notification.
//   - Idempotent: if an ABSENCE notification already exists for
//     (userId, studentId, lessonId) with no cancelledAt, skip.
//
// cancelAbsenceNotifications(tx, input)
//   - For each student who transitioned OUT of "ABSENT", mark any
//     active ABSENCE notification for that (student, lesson) as
//     cancelled by setting metadata.cancelledAt.
// ============================================================

import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export interface AbsenceNotifyInput {
  lessonId: string;
  studentIds: string[];
}

// ------------------------------------------------------------
// createAbsenceNotifications
// ------------------------------------------------------------

export async function createAbsenceNotifications(
  tx: Tx,
  input: AbsenceNotifyInput,
): Promise<{ created: number }> {
  if (input.studentIds.length === 0) return { created: 0 };

  // 1. Load lesson context for a readable message
  const lesson = await tx.lesson.findUnique({
    where: { id: input.lessonId },
    include: {
      class: { select: { name: true } },
      subject: { select: { name: true } },
      module: { select: { name: true } },
    },
  });
  if (!lesson) return { created: 0 };

  // 2. Load students + their parent User IDs
  const students = await tx.student.findMany({
    where: { id: { in: input.studentIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      parentLinks: {
        select: {
          parent: {
            select: { userId: true },
          },
        },
      },
    },
  });

  const subjectLabel =
    lesson.subject?.name ?? lesson.module?.name ?? "class";
  const dateLabel = lesson.date
    ? lesson.date.toISOString().slice(0, 10)
    : "recent lesson";
  const classLabel = lesson.class.name;

  // 3. Build the candidate notification rows
  const candidates: Array<{
    userId: string;
    studentId: string;
    studentFirstName: string;
    studentLastName: string;
  }> = [];

  for (const student of students) {
    for (const link of student.parentLinks) {
      if (!link.parent.userId) continue;
      candidates.push({
        userId: link.parent.userId,
        studentId: student.id,
        studentFirstName: student.firstName,
        studentLastName: student.lastName,
      });
    }
  }

  if (candidates.length === 0) return { created: 0 };

  // 4. Idempotency: find existing non-cancelled ABSENCE notifications
  //    for this (parentUserId, studentId, lessonId).
  //
  // We use metadata JSON to link back to lessonId and studentId, and
  // to check for a cancelledAt marker.
  const existing = await tx.notification.findMany({
    where: {
      userId: { in: candidates.map((c) => c.userId) },
      title: { contains: "was marked absent" },
      metadata: {
        path: ["type"],
        equals: "ABSENCE",
      },
    },
    select: { userId: true, metadata: true },
  });

  const alreadyNotified = new Set<string>();
  for (const n of existing) {
    const meta = (n.metadata ?? {}) as Record<string, unknown>;
    if (meta.lessonId !== input.lessonId) continue;
    if (meta.cancelledAt) continue; // cancelled ones don't count
    const studentId = typeof meta.studentId === "string" ? meta.studentId : null;
    if (studentId) {
      alreadyNotified.add(`${n.userId}::${studentId}`);
    }
  }

  // 5. Filter out candidates who already have an active notification
  const toCreate = candidates.filter(
    (c) => !alreadyNotified.has(`${c.userId}::${c.studentId}`),
  );

  if (toCreate.length === 0) return { created: 0 };

  // 6. Insert
  await tx.notification.createMany({
    data: toCreate.map((c) => ({
      userId: c.userId,
      channel: "IN_APP",
      status: "SENT",
      title: `${c.studentFirstName} was marked absent`,
      body: `${c.studentFirstName} ${c.studentLastName} was absent from ${subjectLabel} (${classLabel}) on ${dateLabel}.`,
      link: "/dashboard/parent",
      sentAt: new Date(),
      metadata: {
        type: "ABSENCE",
        lessonId: input.lessonId,
        studentId: c.studentId,
        classId: lesson.classId,
      },
    })),
  });

  return { created: toCreate.length };
}

// ------------------------------------------------------------
// cancelAbsenceNotifications
// ------------------------------------------------------------
// Called when a student transitions OUT of ABSENT (to PRESENT,
// LATE, or EXCUSED). Marks the notification as cancelled inside
// its metadata. The parent UI filters cancelled ones out.

export async function cancelAbsenceNotifications(
  tx: Tx,
  input: AbsenceNotifyInput,
): Promise<{ cancelled: number }> {
  if (input.studentIds.length === 0) return { cancelled: 0 };

  // Find active (non-cancelled) ABSENCE notifications for these students
  // on this lesson.
  const notifications = await tx.notification.findMany({
    where: {
      metadata: {
        path: ["type"],
        equals: "ABSENCE",
      },
    },
    select: { id: true, metadata: true },
  });

  const toCancel = notifications.filter((n) => {
    const meta = (n.metadata ?? {}) as Record<string, unknown>;
    if (meta.lessonId !== input.lessonId) return false;
    if (meta.cancelledAt) return false;
    const sid = typeof meta.studentId === "string" ? meta.studentId : null;
    return sid !== null && input.studentIds.includes(sid);
  });

  if (toCancel.length === 0) return { cancelled: 0 };

  const now = new Date().toISOString();
  for (const n of toCancel) {
    const meta = (n.metadata ?? {}) as Record<string, unknown>;
    await tx.notification.update({
      where: { id: n.id },
      data: {
        status: "FAILED",
        metadata: { ...meta, cancelledAt: now },
      },
    });
  }

  return { cancelled: toCancel.length };
}