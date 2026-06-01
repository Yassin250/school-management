// src/lib/actions/lesson.ts
"use server";

import { prisma } from "@/lib/prisma";
import {
  lessonSchema,
  termSchema,
  lessonTopicSchema,
  type LessonFormData,
  type TermFormData,
  type LessonTopicFormData,
} from "@/lib/lessonValidation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Day } from "@/generated/prisma/client";

// Utility to convert "HH:MM" into a UTC Date
function parseTimeToUTC(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0, 0));
}

// Revalidation helper
function revalidateAllTimetables() {
  revalidatePath("/dashboard/admin/list/lessons");
  revalidatePath("/dashboard/teacher/timetable");
  revalidatePath("/dashboard/student/timetable");
  revalidatePath("/dashboard/teacher");
  revalidatePath("/dashboard/student");
}

// ========== LESSON ACTIONS ==========

export async function createLesson(data: LessonFormData) {
  try {
    const validated = lessonSchema.parse(data);

    // Check conflict (same teacher, same day, same time slot, same term)
    const teacherConflict = await prisma.lesson.findFirst({
  where: {
    teacherId: validated.teacherId,
    day: validated.day as Day,
    termId: validated.termId,
    NOT: { id: validated.id ?? 0 },
    // Extract just the time portion for comparison
    AND: [
      { startTime: { lte: parseTimeToUTC(validated.endTime) } },
      { endTime: { gte: parseTimeToUTC(validated.startTime) } },
    ],
  },
});

    if (teacherConflict) {
      return { success: false, error: "Teacher is already scheduled for another class during this period" };
    }

    // Check class conflict
    const classConflict = await prisma.lesson.findFirst({
      where: {
        classId: validated.classId,
        day: validated.day as Day,
        termId: validated.termId,
        NOT: {
          OR: [
            { startTime: { gte: parseTimeToUTC(validated.endTime) } },
            { endTime: { lte: parseTimeToUTC(validated.startTime) } },
          ],
        },
      },
    });

    if (classConflict) {
      return { success: false, error: "Class is already scheduled for another lesson during this period" };
    }

    const newLesson = await prisma.lesson.create({
      data: {
        name: validated.name,
        day: validated.day as Day,
        startTime: parseTimeToUTC(validated.startTime),
        endTime: parseTimeToUTC(validated.endTime),
        subjectId: validated.subjectId,
        classId: validated.classId,
        teacherId: validated.teacherId,
        termId: validated.termId,
      },
    });

    revalidateAllTimetables();
    return { success: true, data: newLesson };
  } catch (error) {
    console.error("Create lesson error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to create lesson" };
  }
}

export async function updateLesson(id: number, data: LessonFormData) {
  try {
    const validated = lessonSchema.parse(data);

    // Check teacher conflict
    const teacherConflict = await prisma.lesson.findFirst({
      where: {
        teacherId: validated.teacherId,
        day: validated.day as Day,
        termId: validated.termId,
        NOT: [
          { id },
          {
            OR: [
              { startTime: { gte: parseTimeToUTC(validated.endTime) } },
              { endTime: { lte: parseTimeToUTC(validated.startTime) } },
            ],
          },
        ],
      },
    });

    if (teacherConflict) {
      return { success: false, error: "Teacher is already scheduled for another class during this period" };
    }

    // Check class conflict
    const classConflict = await prisma.lesson.findFirst({
      where: {
        classId: validated.classId,
        day: validated.day as Day,
        termId: validated.termId,
        NOT: [
          { id },
          {
            OR: [
              { startTime: { gte: parseTimeToUTC(validated.endTime) } },
              { endTime: { lte: parseTimeToUTC(validated.startTime) } },
            ],
          },
        ],
      },
    });

    if (classConflict) {
      return { success: false, error: "Class is already scheduled for another lesson during this period" };
    }

    const updated = await prisma.lesson.update({
      where: { id },
      data: {
        name: validated.name,
        day: validated.day as Day,
        startTime: parseTimeToUTC(validated.startTime),
        endTime: parseTimeToUTC(validated.endTime),
        subjectId: validated.subjectId,
        classId: validated.classId,
        teacherId: validated.teacherId,
        termId: validated.termId,
      },
    });

    revalidateAllTimetables();
    return { success: true, data: updated };
  } catch (error) {
    console.error("Update lesson error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to update lesson" };
  }
}

export async function deleteLesson(id: number) {
  try {
    await prisma.lesson.delete({
      where: { id },
    });
    revalidateAllTimetables();
    return { success: true };
  } catch (error) {
    console.error("Delete lesson error:", error);
    return { success: false, error: "Failed to delete lesson" };
  }
}

// ========== TERM ACTIONS ==========

export async function createTerm(data: TermFormData) {
  try {
    const validated = termSchema.parse(data);

    // If marked current, unset other current terms
    if (validated.current) {
      await prisma.term.updateMany({
        where: { current: true },
        data: { current: false },
      });
    }

    const newTerm = await prisma.term.create({
      data: {
        name: validated.name,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        current: validated.current,
      },
    });

    revalidateAllTimetables();
    return { success: true, data: newTerm };
  } catch (error) {
    console.error("Create term error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to create term" };
  }
}

export async function updateTerm(id: number, data: TermFormData) {
  try {
    const validated = termSchema.parse(data);

    if (validated.current) {
      await prisma.term.updateMany({
        where: { current: true, NOT: { id } },
        data: { current: false },
      });
    }

    const updated = await prisma.term.update({
      where: { id },
      data: {
        name: validated.name,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        current: validated.current,
      },
    });

    revalidateAllTimetables();
    return { success: true, data: updated };
  } catch (error) {
    console.error("Update term error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to update term" };
  }
}

export async function setTermCurrent(id: number) {
  try {
    await prisma.term.updateMany({
      where: { current: true },
      data: { current: false },
    });

    await prisma.term.update({
      where: { id },
      data: { current: true },
    });

    revalidateAllTimetables();
    return { success: true };
  } catch (error) {
    console.error("Set term current error:", error);
    return { success: false, error: "Failed to update current term" };
  }
}

export async function deleteTerm(id: number) {
  try {
    const term = await prisma.term.findUnique({
      where: { id },
      include: { _count: { select: { lessons: true } } },
    });

    if (!term) {
      return { success: false, error: "Term not found" };
    }

    if (term.current) {
      return { success: false, error: "Cannot delete the current active term. Mark another term as current first." };
    }

    if (term._count.lessons > 0) {
      return { success: false, error: "Cannot delete term with scheduled lessons. Delete lessons first." };
    }

    await prisma.term.delete({
      where: { id },
    });

    revalidateAllTimetables();
    return { success: true };
  } catch (error) {
    console.error("Delete term error:", error);
    return { success: false, error: "Failed to delete term" };
  }
}

// ========== LESSON TOPIC ACTIONS ==========

export async function upsertLessonTopic(data: LessonTopicFormData) {
  try {
    const validated = lessonTopicSchema.parse(data);

    const topic = await prisma.lessonTopic.upsert({
      where: {
        lessonId_weekNumber: {
          lessonId: validated.lessonId,
          weekNumber: validated.weekNumber,
        },
      },
      update: {
        topic: validated.topic,
      },
      create: {
        lessonId: validated.lessonId,
        weekNumber: validated.weekNumber,
        topic: validated.topic,
      },
    });

    revalidateAllTimetables();
    return { success: true, data: topic };
  } catch (error) {
    console.error("Upsert lesson topic error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to save topic" };
  }
}
