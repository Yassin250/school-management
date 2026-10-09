// ============================================================
// Timetable Service
// Comprehensive Schedule Management & Conflict Detection
// ============================================================

import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { logAudit } from "@/lib/audit/audit";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";

import {
  DAYS_OF_WEEK,
  STANDARD_PERIODS,
  timeToMinutes,
  rangesOverlap,
  type LessonConflict,
  type CreateLessonInput,
  type UpdateLessonInput,
} from "./types";

export {
  DAYS_OF_WEEK,
  STANDARD_PERIODS,
  timeToMinutes,
  rangesOverlap,
  type LessonConflict,
  type CreateLessonInput,
  type UpdateLessonInput,
};

// ------------------------------------------------------------
// 1. Conflict Detection
// ------------------------------------------------------------

export async function detectLessonConflicts(params: {
  academicYearId: string;
  termId: string;
  timetableVersionId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  teacherId: string;
  classId: string;
  room?: string | null;
  excludeLessonId?: string;
}): Promise<LessonConflict[]> {
  const {
    academicYearId,
    termId,
    dayOfWeek,
    startTime,
    endTime,
    teacherId,
    classId,
    room,
    excludeLessonId,
  } = params;

  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    throw new ValidationError("Start time must be before end time.");
  }

  // Find all lessons for the same term and day of week
  const sameDayLessons = await prisma.lesson.findMany({
    where: {
      academicYearId,
      termId,
      dayOfWeek,
      ...(excludeLessonId ? { id: { not: excludeLessonId } } : {}),
      OR: [
        { teacherId },
        { classId },
        ...(room && room.trim() !== "" ? [{ room: { equals: room.trim(), mode: "insensitive" as const } }] : []),
      ],
    },
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, firstName: true, lastName: true } },
      subject: { select: { id: true, name: true } },
      module: { select: { id: true, name: true } },
    },
  });

  const conflicts: LessonConflict[] = [];

  for (const l of sameDayLessons) {
    if (!rangesOverlap(startTime, endTime, l.startTime, l.endTime)) {
      continue;
    }

    const timeSlot = `${l.startTime} - ${l.endTime}`;
    const subjectTitle = l.subject?.name ?? l.module?.name ?? "General";
    const teacherTitle = `${l.teacher.firstName} ${l.teacher.lastName}`;

    // 1. Class conflict
    if (l.classId === classId) {
      conflicts.push({
        type: "CLASS",
        message: `Class "${l.class.name}" already has ${subjectTitle} scheduled at ${timeSlot}.`,
        conflictingLessonId: l.id,
        conflictingClassName: l.class.name,
        conflictingSubjectName: subjectTitle,
        conflictingTeacherName: teacherTitle,
        timeSlot,
      });
    }

    // 2. Teacher conflict
    if (l.teacherId === teacherId && l.classId !== classId) {
      conflicts.push({
        type: "TEACHER",
        message: `Teacher ${teacherTitle} is already teaching ${subjectTitle} in class "${l.class.name}" at ${timeSlot}.`,
        conflictingLessonId: l.id,
        conflictingClassName: l.class.name,
        conflictingSubjectName: subjectTitle,
        conflictingTeacherName: teacherTitle,
        timeSlot,
      });
    }

    // 3. Room conflict
    if (
      room &&
      room.trim() !== "" &&
      l.room &&
      l.room.trim().toLowerCase() === room.trim().toLowerCase() &&
      l.classId !== classId
    ) {
      conflicts.push({
        type: "ROOM",
        message: `Room "${l.room}" is already reserved for class "${l.class.name}" (${subjectTitle}) at ${timeSlot}.`,
        conflictingLessonId: l.id,
        conflictingClassName: l.class.name,
        conflictingSubjectName: subjectTitle,
        conflictingTeacherName: teacherTitle,
        conflictingRoom: l.room,
        timeSlot,
      });
    }
  }

  return conflicts;
}

// ------------------------------------------------------------
// 2. Read Schedule & Options
// ------------------------------------------------------------

export async function getClassTimetable(actor: CurrentUser, classId: string) {
  const allowed = await canForUser(actor, "timetable.read");
  if (!allowed) throw new ForbiddenError("timetable.read");

  const [cls, lessons] = await Promise.all([
    prisma.class.findUnique({
      where: { id: classId },
      include: {
        academicYear: true,
        educationLevel: true,
      },
    }),
    prisma.lesson.findMany({
      where: { classId },
      include: {
        subject: true,
        module: true,
        teacher: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
  ]);

  return {
    class: cls
      ? {
          id: cls.id,
          name: cls.name,
          levelName: cls.educationLevel.name,
          academicYearName: cls.academicYear.name,
          academicYearId: cls.academicYearId,
        }
      : null,
    lessons: lessons.map((l) => ({
      id: l.id,
      dayOfWeek: l.dayOfWeek,
      dayName: DAYS_OF_WEEK.find((d) => d.id === l.dayOfWeek)?.name ?? `Day ${l.dayOfWeek}`,
      startTime: l.startTime,
      endTime: l.endTime,
      room: l.room ?? "Main Hall",
      subjectId: l.subjectId,
      moduleId: l.moduleId,
      subjectName: l.subject?.name ?? l.module?.name ?? "General Study",
      teacherId: l.teacherId,
      teacherName: `${l.teacher.firstName} ${l.teacher.lastName}`,
      timetableVersionId: l.timetableVersionId,
      academicYearId: l.academicYearId,
      termId: l.termId,
    })),
  };
}

export async function getTimetableEditorData(
  actor: CurrentUser,
  selectedClassId?: string,
  selectedTeacherId?: string,
) {
  const allowed = await canForUser(actor, "timetable.read");
  if (!allowed) throw new ForbiddenError("timetable.read");

  const canManage = await canForUser(actor, "timetable.create");

  // Get active year and term
  const activeYear =
    (await prisma.academicYear.findFirst({
      where: { isCurrent: true },
      include: { terms: { orderBy: { startDate: "asc" } } },
    })) ??
    (await prisma.academicYear.findFirst({
      orderBy: { startDate: "desc" },
      include: { terms: { orderBy: { startDate: "asc" } } },
    }));

  const activeTerm =
    activeYear?.terms.find((t) => t.isCurrent) ?? activeYear?.terms[0] ?? null;

  // Load all classes and teachers
  const [classes, teachers, subjects, modules] = await Promise.all([
    prisma.class.findMany({
      where: activeYear ? { academicYearId: activeYear.id, isActive: true } : { isActive: true },
      include: {
        educationLevel: { select: { name: true, code: true } },
        classSubjects: { include: { subject: true } },
        classModules: { include: { module: true } },
      },
      orderBy: [{ educationLevel: { order: "asc" } }, { name: "asc" }],
    }),
    prisma.teacher.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        staffCode: true,
        assignments: {
          select: { classId: true, subjectId: true, moduleId: true },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.module.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const targetClassId = selectedClassId ?? classes[0]?.id ?? null;

  let schedule = null;
  if (targetClassId) {
    schedule = await getClassTimetable(actor, targetClassId);
  }

  let teacherSchedule = null;
  if (selectedTeacherId) {
    const teacherLessons = await prisma.lesson.findMany({
      where: { teacherId: selectedTeacherId },
      include: {
        class: true,
        subject: true,
        module: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    teacherSchedule = teacherLessons.map((l) => ({
      id: l.id,
      dayOfWeek: l.dayOfWeek,
      dayName: DAYS_OF_WEEK.find((d) => d.id === l.dayOfWeek)?.name ?? `Day ${l.dayOfWeek}`,
      startTime: l.startTime,
      endTime: l.endTime,
      room: l.room ?? "Main Hall",
      subjectName: l.subject?.name ?? l.module?.name ?? "General Study",
      className: l.class.name,
      classId: l.classId,
    }));
  }

  return {
    canManage,
    activeYear,
    activeTerm,
    classes: classes.map((c) => ({
      id: c.id,
      name: c.name,
      levelName: c.educationLevel.name,
      levelCode: c.educationLevel.code,
      availableSubjects: c.classSubjects.map((cs) => ({
        id: cs.subject.id,
        name: cs.subject.name,
        code: cs.subject.code,
      })),
      availableModules: c.classModules.map((cm) => ({
        id: cm.module.id,
        name: cm.module.name,
        code: cm.module.code,
      })),
    })),
    teachers: teachers.map((t) => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName}`,
      staffCode: t.staffCode,
      assignedClassIds: t.assignments.map((a) => a.classId),
    })),
    subjects,
    modules,
    selectedClassId: targetClassId,
    selectedTeacherId: selectedTeacherId ?? null,
    schedule,
    teacherSchedule,
  };
}

// ------------------------------------------------------------
// 3. Create Lesson Period
// ------------------------------------------------------------

export async function createLesson(
  actor: CurrentUser,
  input: CreateLessonInput,
) {
  const allowed = await canForUser(actor, "timetable.create");
  if (!allowed) throw new ForbiddenError("timetable.create");

  // Validate Class
  const cls = await prisma.class.findUnique({
    where: { id: input.classId },
    include: { academicYear: { include: { terms: true } } },
  });
  if (!cls) throw new NotFoundError("Class", input.classId);

  const academicYearId = input.academicYearId ?? cls.academicYearId;
  const term =
    (input.termId
      ? cls.academicYear.terms.find((t) => t.id === input.termId)
      : cls.academicYear.terms.find((t) => t.isCurrent) ?? cls.academicYear.terms[0]) ?? null;

  if (!term) {
    throw new ValidationError("No academic term found for scheduling this lesson.");
  }

  // Validate Teacher
  const teacher = await prisma.teacher.findUnique({
    where: { id: input.teacherId },
  });
  if (!teacher || teacher.status !== "ACTIVE") {
    throw new ValidationError("Selected teacher does not exist or is inactive.");
  }

  // Find or create active TimetableVersion
  let version = await prisma.timetableVersion.findFirst({
    where: {
      academicYearId,
      termId: term.id,
      isActive: true,
    },
  });

  if (!version) {
    version = await prisma.timetableVersion.create({
      data: {
        academicYearId,
        termId: term.id,
        version: 1,
        isActive: true,
        notes: "Initial active schedule",
      },
    });
  }

  // Clash / Conflict Detection
  const conflicts = await detectLessonConflicts({
    academicYearId,
    termId: term.id,
    timetableVersionId: version.id,
    dayOfWeek: input.dayOfWeek,
    startTime: input.startTime,
    endTime: input.endTime,
    teacherId: input.teacherId,
    classId: input.classId,
    room: input.room,
  });

  if (conflicts.length > 0) {
    const errorMessages = conflicts.map((c) => c.message).join(" ");
    throw new ValidationError(`Schedule conflict detected: ${errorMessages}`);
  }

  const lesson = await prisma.lesson.create({
    data: {
      timetableVersionId: version.id,
      academicYearId,
      termId: term.id,
      classId: input.classId,
      subjectId: input.subjectId || null,
      moduleId: input.moduleId || null,
      teacherId: input.teacherId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      room: input.room ? input.room.trim() : null,
    },
    include: {
      subject: true,
      module: true,
      teacher: true,
      class: true,
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "TIMETABLE_LESSON_CREATED",
    entity: "Lesson",
    entityId: lesson.id,
    description: `Created lesson period for class ${cls.name} (${input.startTime} - ${input.endTime}) on day ${input.dayOfWeek}`,
    newValue: {
      classId: lesson.classId,
      teacherId: lesson.teacherId,
      dayOfWeek: lesson.dayOfWeek,
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      room: lesson.room,
    },
  });

  return lesson;
}

// ------------------------------------------------------------
// 4. Update Lesson Period
// ------------------------------------------------------------

export async function updateLesson(
  actor: CurrentUser,
  lessonId: string,
  input: UpdateLessonInput,
) {
  const allowed = await canForUser(actor, "timetable.update");
  if (!allowed) throw new ForbiddenError("timetable.update");

  const existing = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { class: true },
  });
  if (!existing) throw new NotFoundError("Lesson", lessonId);

  const dayOfWeek = input.dayOfWeek ?? existing.dayOfWeek;
  const startTime = input.startTime ?? existing.startTime;
  const endTime = input.endTime ?? existing.endTime;
  const teacherId = input.teacherId ?? existing.teacherId;
  const room = input.room !== undefined ? input.room : existing.room;

  // Conflict detection
  const conflicts = await detectLessonConflicts({
    academicYearId: existing.academicYearId,
    termId: existing.termId,
    timetableVersionId: existing.timetableVersionId,
    dayOfWeek,
    startTime,
    endTime,
    teacherId,
    classId: existing.classId,
    room,
    excludeLessonId: lessonId,
  });

  if (conflicts.length > 0) {
    const errorMessages = conflicts.map((c) => c.message).join(" ");
    throw new ValidationError(`Schedule conflict detected: ${errorMessages}`);
  }

  const updated = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      dayOfWeek,
      startTime,
      endTime,
      teacherId,
      subjectId: input.subjectId !== undefined ? input.subjectId : existing.subjectId,
      moduleId: input.moduleId !== undefined ? input.moduleId : existing.moduleId,
      room: room ? room.trim() : null,
    },
    include: {
      subject: true,
      module: true,
      teacher: true,
      class: true,
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "TIMETABLE_LESSON_UPDATED",
    entity: "Lesson",
    entityId: lessonId,
    description: `Updated lesson ${lessonId} for class ${existing.class.name}`,
    previousValue: {
      dayOfWeek: existing.dayOfWeek,
      startTime: existing.startTime,
      endTime: existing.endTime,
      teacherId: existing.teacherId,
      room: existing.room,
    },
    newValue: {
      dayOfWeek: updated.dayOfWeek,
      startTime: updated.startTime,
      endTime: updated.endTime,
      teacherId: updated.teacherId,
      room: updated.room,
    },
  });

  return updated;
}

// ------------------------------------------------------------
// 5. Delete Lesson Period
// ------------------------------------------------------------

export async function deleteLesson(
  actor: CurrentUser,
  lessonId: string,
) {
  const allowed = await canForUser(actor, "timetable.update");
  if (!allowed) throw new ForbiddenError("timetable.update");

  const existing = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      class: true,
      _count: { select: { attendances: true } },
    },
  });
  if (!existing) throw new NotFoundError("Lesson", lessonId);

  if (existing._count.attendances > 0) {
    throw new ValidationError(
      `Cannot delete this lesson period because ${existing._count.attendances} attendance records have already been recorded. Mark it inactive instead.`,
    );
  }

  await prisma.lesson.delete({
    where: { id: lessonId },
  });

  await logAudit({
    actorId: actor.id,
    action: "TIMETABLE_LESSON_DELETED",
    entity: "Lesson",
    entityId: lessonId,
    description: `Deleted lesson period from class ${existing.class.name} (${existing.startTime} - ${existing.endTime}, Day ${existing.dayOfWeek})`,
  });

  return { success: true };
}
