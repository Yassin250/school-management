// ============================================================
// Attendance Service — session-based lifecycle
// DRAFT → RECORDED → FINALIZED (+ correction workflow)
// ============================================================

import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { logAudit } from "@/lib/audit/audit";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";
import type { AttendanceSessionStatus, AttendanceStatus } from "@prisma/client";
import {
  cancelAbsenceNotifications,
  createAbsenceNotifications,
} from "@/lib/services/notifications/absence";

export interface AttendanceRecordInput {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface SaveAttendanceInput {
  lessonId: string;
  sessionDate?: Date | string;
  records: AttendanceRecordInput[];
}

export interface AttendanceRosterStudent {
  id: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  currentStatus: AttendanceStatus;
  note: string;
  attendanceId?: string;
}

export interface AttendanceSessionView {
  sessionId: string | null;
  sessionStatus: AttendanceSessionStatus | null;
  sessionDate: Date;
  canEdit: boolean;
  class: { id: string; name: string; educationLevelName: string };
  lesson: {
    id: string;
    subjectName: string;
    startTime: string;
    endTime: string;
  };
  students: AttendanceRosterStudent[];
}

const VALID_STATUSES = new Set<AttendanceStatus>([
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
]);

function startOfUtcDay(value: Date | string = new Date()): Date {
  const d = new Date(value);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function lessonForTeacher(actor: CurrentUser, lessonId: string) {
  if (!actor.teacherId) throw new ForbiddenError("attendance.create");
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      class: { select: { id: true, name: true } },
      subject: { select: { name: true } },
      module: { select: { name: true } },
    },
  });
  if (!lesson) throw new NotFoundError("Lesson", lessonId);
  if (lesson.teacherId !== actor.teacherId) {
    throw new ForbiddenError("attendance.create");
  }
  return lesson;
}

async function validateRoster(
  classId: string,
  records: AttendanceRecordInput[],
) {
  if (!records.length) {
    throw new ValidationError("No attendance records provided.");
  }
  const ids = records.map((r) => r.studentId);
  if (new Set(ids).size !== ids.length) {
    throw new ValidationError("Duplicate student IDs in the request.");
  }
  if (records.some((r) => !VALID_STATUSES.has(r.status))) {
    throw new ValidationError("Invalid attendance status.");
  }
  const enrolled = await prisma.enrollment.findMany({
    where: { classId, studentId: { in: ids }, status: "ACTIVE" },
    select: { studentId: true },
  });
  if (enrolled.length !== ids.length) {
    throw new ValidationError(
      "Every attendance record must belong to an active student in this class.",
    );
  }
}

export async function listTeacherLessons(actor: CurrentUser) {
  if (!actor.teacherId) return [];
  const allowed = await canForUser(actor, "attendance.create");
  if (!allowed) throw new ForbiddenError("attendance.create");

  return prisma.lesson.findMany({
    where: { teacherId: actor.teacherId },
    include: {
      class: { select: { id: true, name: true } },
      subject: { select: { name: true } },
      module: { select: { name: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

export async function getAttendanceSessionRoster(
  actor: CurrentUser,
  lessonId: string,
  sessionDateInput?: Date | string,
): Promise<AttendanceSessionView> {
  const lesson = await lessonForTeacher(actor, lessonId);
  const sessionDate = startOfUtcDay(sessionDateInput);

  const cls = await prisma.class.findUnique({
    where: { id: lesson.classId },
    include: { educationLevel: { select: { name: true } } },
  });
  if (!cls) throw new NotFoundError("Class", lesson.classId);

  const enrollments = await prisma.enrollment.findMany({
    where: { classId: lesson.classId, status: "ACTIVE" },
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
    orderBy: [
      { student: { lastName: "asc" } },
      { student: { firstName: "asc" } },
    ],
  });

  const session = await prisma.attendanceSession.findUnique({
    where: {
      lessonId_sessionDate: { lessonId: lesson.id, sessionDate },
    },
    include: {
      records: {
        select: {
          id: true,
          studentId: true,
          status: true,
          note: true,
        },
      },
    },
  });

  const byStudent = new Map(
    session?.records.map((r) => [r.studentId, r]) ?? [],
  );

  const students: AttendanceRosterStudent[] = enrollments.map(({ student }) => {
    const row = byStudent.get(student.id);
    return {
      ...student,
      currentStatus: row?.status ?? "PRESENT",
      note: row?.note ?? "",
      attendanceId: row?.id,
    };
  });

  const finalized = session?.status === "FINALIZED";

  return {
    sessionId: session?.id ?? null,
    sessionStatus: session?.status ?? null,
    sessionDate,
    canEdit: !finalized,
    class: {
      id: cls.id,
      name: cls.name,
      educationLevelName: cls.educationLevel.name,
    },
    lesson: {
      id: lesson.id,
      subjectName:
        lesson.subject?.name ?? lesson.module?.name ?? "General Study",
      startTime: lesson.startTime,
      endTime: lesson.endTime,
    },
    students,
  };
}

export async function saveAttendance(
  actor: CurrentUser,
  input: SaveAttendanceInput,
  _prisma: PrismaClient = prisma,
) {
  if (!(await canForUser(actor, "attendance.create"))) {
    throw new ForbiddenError("attendance.create");
  }
  const lesson = await lessonForTeacher(actor, input.lessonId);
  await validateRoster(lesson.classId, input.records);
  const sessionDate = startOfUtcDay(input.sessionDate);

  return _prisma.$transaction(async (tx) => {
    const session = await tx.attendanceSession.upsert({
      where: {
        lessonId_sessionDate: { lessonId: lesson.id, sessionDate },
      },
      create: {
        academicYearId: lesson.academicYearId,
        termId: lesson.termId,
        classId: lesson.classId,
        lessonId: lesson.id,
        teacherId: lesson.teacherId,
        createdById: actor.teacherId!,
        sessionDate,
        status: "DRAFT",
      },
      update: {},
    });

    if (session.teacherId !== actor.teacherId) {
      throw new ForbiddenError("attendance.create");
    }
    if (session.status === "FINALIZED") {
      throw new ValidationError(
        "Finalized attendance cannot be edited. Request a correction.",
      );
    }

    const priorRows = await tx.attendance.findMany({
      where: { sessionId: session.id },
      select: { studentId: true, status: true },
    });
    const priorStatus = new Map(
      priorRows.map((r) => [r.studentId, r.status]),
    );

    let created = 0;
    let updated = 0;
    for (const record of input.records) {
      const existing = await tx.attendance.findUnique({
        where: {
          sessionId_studentId: {
            sessionId: session.id,
            studentId: record.studentId,
          },
        },
      });
      if (existing) {
        await tx.attendance.update({
          where: { id: existing.id },
          data: {
            status: record.status,
            note: record.note?.trim() || null,
            markedById: actor.teacherId!,
          },
        });
        updated++;
      } else {
        await tx.attendance.create({
          data: {
            studentId: record.studentId,
            lessonId: lesson.id,
            sessionId: session.id,
            status: record.status,
            note: record.note?.trim() || null,
            markedById: actor.teacherId!,
          },
        });
        created++;
      }
    }

    const nextStatus: AttendanceSessionStatus =
      session.status === "DRAFT" ? "RECORDED" : session.status;

    const saved = await tx.attendanceSession.update({
      where: { id: session.id },
      data: { status: nextStatus },
    });

    const newlyAbsent = input.records
      .filter(
        (r) =>
          r.status === "ABSENT" &&
          priorStatus.get(r.studentId) !== "ABSENT",
      )
      .map((r) => r.studentId);

    const noLongerAbsent = input.records
      .filter(
        (r) =>
          r.status !== "ABSENT" &&
          priorStatus.get(r.studentId) === "ABSENT",
      )
      .map((r) => r.studentId);

    await createAbsenceNotifications(tx, {
      lessonId: lesson.id,
      studentIds: newlyAbsent,
    });
    await cancelAbsenceNotifications(tx, {
      lessonId: lesson.id,
      studentIds: noLongerAbsent,
    });

    await logAudit({
      actorId: actor.id,
      action: "ATTENDANCE_MARKED",
      entity: "AttendanceSession",
      entityId: session.id,
      description: `Recorded attendance for ${input.records.length} student(s)`,
      newValue: {
        lessonId: lesson.id,
        sessionDate: sessionDate.toISOString(),
        created,
        updated,
        status: nextStatus,
      },
      tx,
    });

    return {
      sessionId: saved.id,
      status: saved.status,
      created,
      updated,
      total: input.records.length,
    };
  });
}

export async function finalizeAttendance(
  actor: CurrentUser,
  sessionId: string,
  _prisma: PrismaClient = prisma,
) {
  if (!(await canForUser(actor, "attendance.create"))) {
    throw new ForbiddenError("attendance.create");
  }
  if (!actor.teacherId) throw new ForbiddenError("attendance.create");

  return _prisma.$transaction(async (tx) => {
    const session = await tx.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { _count: { select: { records: true } } },
    });
    if (!session) throw new NotFoundError("AttendanceSession", sessionId);
    if (session.teacherId !== actor.teacherId) {
      throw new ForbiddenError("attendance.create");
    }
    if (session.status === "FINALIZED") {
      throw new ValidationError("Attendance session is already finalized.");
    }

    const enrolled = await tx.enrollment.count({
      where: { classId: session.classId, status: "ACTIVE" },
    });
    if (enrolled === 0 || session._count.records !== enrolled) {
      throw new ValidationError(
        "All active students must be recorded before finalization.",
      );
    }

    const finalized = await tx.attendanceSession.update({
      where: { id: session.id },
      data: {
        status: "FINALIZED",
        finalizedAt: new Date(),
        finalizedById: actor.teacherId,
      },
    });

    await logAudit({
      actorId: actor.id,
      action: "ATTENDANCE_FINALIZED",
      entity: "AttendanceSession",
      entityId: session.id,
      description: "Finalized attendance session",
      newValue: { status: "FINALIZED", records: enrolled },
      tx,
    });

    return finalized;
  });
}

export async function requestAttendanceCorrection(
  actor: CurrentUser,
  attendanceId: string,
  proposed: AttendanceRecordInput,
  reason: string,
  _prisma: PrismaClient = prisma,
) {
  const attendance = await _prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: { session: true },
  });
  if (!attendance?.session) {
    throw new ValidationError("Only session-based attendance can be corrected.");
  }
  if (attendance.session.status !== "FINALIZED") {
    throw new ValidationError(
      "Only finalized attendance requires a correction request.",
    );
  }
  if (!reason.trim() || !VALID_STATUSES.has(proposed.status)) {
    throw new ValidationError(
      "A correction reason and valid status are required.",
    );
  }

  const ownsSession = actor.teacherId === attendance.session.teacherId;
  if (!ownsSession) {
    const canCorrect = await canForUser(actor, "attendance.correct");
    if (!canCorrect) throw new ForbiddenError("attendance.correct");
  }

  const correction = await _prisma.attendanceCorrection.create({
    data: {
      sessionId: attendance.sessionId!,
      attendanceId,
      requestedById: actor.id,
      reason: reason.trim(),
      previousValue: { status: attendance.status, note: attendance.note },
      proposedValue: {
        status: proposed.status,
        note: proposed.note ?? null,
      },
    },
  });

await logAudit({
      actorId: actor.id,
      action: "ATTENDANCE_CORRECTION_REQUESTED",
      entity: "AttendanceCorrection",
      entityId: correction.id,
      description: "Requested attendance correction",
      previousValue: { status: attendance.status, note: attendance.note },
      newValue: {
        status: proposed.status,
        note: proposed.note ?? null,
      },
    });

  return correction;
}

export async function approveAttendanceCorrection(
  actor: CurrentUser,
  correctionId: string,
  _prisma: PrismaClient = prisma,
) {
  if (!(await canForUser(actor, "attendance.correct"))) {
    throw new ForbiddenError("attendance.correct");
  }

  return _prisma.$transaction(async (tx) => {
    const correction = await tx.attendanceCorrection.findUnique({
      where: { id: correctionId },
      include: { attendance: true, session: true },
    });
    if (!correction) throw new NotFoundError("AttendanceCorrection", correctionId);
    if (
      correction.status !== "REQUESTED" ||
      correction.session.status !== "FINALIZED"
    ) {
      throw new ValidationError("This correction cannot be approved.");
    }

    const proposed = correction.proposedValue as {
      status: AttendanceStatus;
      note: string | null;
    };

    await tx.attendance.update({
      where: { id: correction.attendanceId },
      data: {
        status: proposed.status,
        note: proposed.note,
        markedById: correction.session.teacherId,
      },
    });

    const applied = await tx.attendanceCorrection.update({
      where: { id: correction.id },
      data: {
        status: "APPLIED",
        reviewedById: actor.id,
        reviewedAt: new Date(),
        appliedAt: new Date(),
      },
    });

    await logAudit({
      actorId: actor.id,
      action: "ATTENDANCE_CORRECTED",
      entity: "Attendance",
      entityId: correction.attendanceId,
      previousValue: correction.previousValue,
      newValue: correction.proposedValue,
      tx,
    });

    return applied;
  });
}

export function calculateAttendanceSummary(statuses: AttendanceStatus[]) {
  const present = statuses.filter((s) => s === "PRESENT").length;
  const late = statuses.filter((s) => s === "LATE").length;
  const absent = statuses.filter((s) => s === "ABSENT").length;
  const excused = statuses.filter((s) => s === "EXCUSED").length;
  const eligible = present + late + absent;
  return {
    total: statuses.length,
    present,
    late,
    absent,
    excused,
    percentage: eligible
      ? Number((((present + late) / eligible) * 100).toFixed(2))
      : 0,
  };
}

export async function getStudentAttendanceSummary(
  actor: CurrentUser,
  studentId: string,
) {
  if (
    !(await canForUser(actor, "attendance.read", {
      type: "student",
      studentId,
    }))
  ) {
    throw new ForbiddenError("attendance.read");
  }
  const records = await prisma.attendance.findMany({
    where: {
      studentId,
      session: { is: { status: "FINALIZED" } },
    },
    select: { status: true },
  });
  return calculateAttendanceSummary(records.map((r) => r.status));
}

export interface StudentAttendanceHistoryItem {
  id: string;
  sessionDate: Date;
  status: AttendanceStatus;
  note: string | null;
  className: string;
  subjectName: string;
}

export async function getStudentAttendanceHistory(
  actor: CurrentUser,
  studentId: string,
): Promise<{
  summary: ReturnType<typeof calculateAttendanceSummary>;
  history: StudentAttendanceHistoryItem[];
}> {
  if (
    !(await canForUser(actor, "attendance.read", {
      type: "student",
      studentId,
    }))
  ) {
    throw new ForbiddenError("attendance.read");
  }

  const records = await prisma.attendance.findMany({
    where: {
      studentId,
      session: { is: { status: "FINALIZED" } },
    },
    include: {
      session: {
        include: {
          class: { select: { name: true } },
          lesson: {
            include: {
              subject: { select: { name: true } },
              module: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { session: { sessionDate: "desc" } },
    take: 100,
  });

  const history: StudentAttendanceHistoryItem[] = records.map((r) => ({
    id: r.id,
    sessionDate: r.session!.sessionDate,
    status: r.status,
    note: r.note,
    className: r.session!.class.name,
    subjectName:
      r.session!.lesson.subject?.name ??
      r.session!.lesson.module?.name ??
      "Lesson",
  }));

  return {
    summary: calculateAttendanceSummary(records.map((r) => r.status)),
    history,
  };
}

export async function listClassAttendanceOverview(actor: CurrentUser) {
  if (!(await canForUser(actor, "attendance.reports"))) {
    throw new ForbiddenError("attendance.reports");
  }

  const sessions = await prisma.attendanceSession.findMany({
    where: { status: "FINALIZED" },
    include: {
      class: { select: { id: true, name: true } },
      _count: { select: { records: true } },
    },
    orderBy: { sessionDate: "desc" },
    take: 50,
  });

  return sessions.map((s) => ({
    sessionId: s.id,
    classId: s.classId,
    className: s.class.name,
    sessionDate: s.sessionDate,
    status: s.status,
    recordCount: s._count.records,
  }));
}

export async function listPendingAttendanceCorrections(actor: CurrentUser) {
  if (!(await canForUser(actor, "attendance.correct"))) {
    throw new ForbiddenError("attendance.correct");
  }

  return prisma.attendanceCorrection.findMany({
    where: { status: "REQUESTED" },
    include: {
      attendance: {
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              studentCode: true,
            },
          },
        },
      },
      session: {
        include: { class: { select: { name: true } } },
      },
      requestedBy: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/** @deprecated Use getAttendanceSessionRoster for teachers. */
export async function getClassAttendanceRoster(
  actor: CurrentUser,
  classId: string,
  lessonId?: string,
) {
  if (
    !(await canForUser(actor, "attendance.read", { type: "class", classId }))
  ) {
    throw new ForbiddenError("attendance.read");
  }
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { educationLevel: { select: { name: true } } },
  });
  if (!cls) throw new NotFoundError("Class", classId);

  const students = await prisma.enrollment.findMany({
    where: { classId, status: "ACTIVE" },
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
    orderBy: [
      { student: { lastName: "asc" } },
      { student: { firstName: "asc" } },
    ],
  });

  return {
    class: {
      id: cls.id,
      name: cls.name,
      educationLevelName: cls.educationLevel.name,
    },
    lessonId: lessonId ?? null,
    students: students.map(({ student }) => ({
      ...student,
      currentStatus: "PRESENT" as AttendanceStatus,
      note: "",
    })),
  };
}

export async function listAttendance(actor: CurrentUser, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (
    !lesson ||
    !(await canForUser(actor, "attendance.read", {
      type: "class",
      classId: lesson.classId,
    }))
  ) {
    throw new ForbiddenError("attendance.read");
  }
  return prisma.attendance.findMany({
    where: { lessonId },
    include: {
      student: {
        select: {
          id: true,
          studentCode: true,
          firstName: true,
          lastName: true,
        },
      },
      session: true,
    },
    orderBy: { student: { lastName: "asc" } },
  });
}
