// src/lib/data/lesson.ts
import { prisma } from "@/lib/prisma";
import type { Lesson, Subject, Class, Teacher, Term, LessonTopic } from "@/generated/prisma/client";

// ============================================================
// TYPES
// ============================================================

export type LessonWithRelations = Lesson & {
  subject: Subject;
  class: Class;
  teacher: Pick<Teacher, "id" | "name" | "surname">;
  term?: Term | null;
  topics?: LessonTopic[];
};

export type TimetableSlot = {
  id: number;
  name: string;
  day: string;
  startTime: string;  // HH:MM format
  endTime: string;    // HH:MM format
  subject: string;
  subjectId: number;
  class: string;
  classId: number;
  teacher: string;
  teacherId: string;
  termId: number;
  topics: { weekNumber: number; topic: string }[];
};

export type LessonFormInitialData = {
  id?: number;
  name: string;
  day: string;
  startTime: string;
  endTime: string;
  subjectId: number;
  classId: number;
  teacherId: string;
  termId: number;
};

// ============================================================
// FORMATTING HELPERS
// ============================================================

/**
 * Converts a Date to HH:MM string (UTC)
 */
function formatTime(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Maps a Prisma lesson to the TimetableSlot format used by the UI grid
 */
export function mapLessonToSlot(lesson: LessonWithRelations): TimetableSlot {
  return {
    id: lesson.id,
    name: lesson.name,
    day: lesson.day,
    startTime: formatTime(lesson.startTime),
    endTime: formatTime(lesson.endTime),
    subject: lesson.subject.name,
    subjectId: lesson.subject.id,
    class: lesson.class.name,
    classId: lesson.class.id,
    teacher: `${lesson.teacher.name} ${lesson.teacher.surname}`,
    teacherId: lesson.teacher.id,
    termId: lesson.termId ?? 0,
    topics: (lesson.topics || []).map((t) => ({
      weekNumber: t.weekNumber,
      topic: t.topic,
    })),
  };
}

/**
 * Maps a lesson to form initial data for editing
 */
export function mapLessonToFormData(lesson: LessonWithRelations): LessonFormInitialData {
  return {
    id: lesson.id,
    name: lesson.name,
    day: lesson.day,
    startTime: formatTime(lesson.startTime),
    endTime: formatTime(lesson.endTime),
    subjectId: lesson.subjectId,
    classId: lesson.classId,
    teacherId: lesson.teacherId,
    termId: lesson.termId ?? 0,
  };
}

// ============================================================
// DATA FETCHING FUNCTIONS
// ============================================================

/**
 * Get all terms for the term selector dropdown
 */
export async function getTerms() {
  const terms = await prisma.term.findMany({
    orderBy: { startDate: "desc" },
  });

  return terms.map((t) => ({
    id: t.id,
    name: t.name,
    startDate: t.startDate.toISOString().split("T")[0],
    endDate: t.endDate.toISOString().split("T")[0],
    current: t.current,
  }));
}

/**
 * Get the current active term
 */
export async function getCurrentTerm() {
  const term = await prisma.term.findFirst({
    where: { current: true },
  });

  if (!term) {
    // Fallback to most recent term
    return prisma.term.findFirst({
      orderBy: { startDate: "desc" },
    });
  }

  return term;
}

/**
 * Get all related data needed for the lesson form dropdowns
 */
export async function getLessonRelatedData() {
  const [subjects, classes, teachers, terms] = await Promise.all([
    prisma.subject.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.class.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.teacher.findMany({
      select: { id: true, name: true, surname: true },
      orderBy: { name: "asc" },
    }),
    prisma.term.findMany({
      select: { id: true, name: true, current: true },
      orderBy: { startDate: "desc" },
    }),
  ]);

  return {
    subjects: subjects.map((s) => ({ id: s.id, name: s.name })),
    classes: classes.map((c) => ({ id: c.id, name: c.name })),
    teachers: teachers.map((t) => ({
      id: t.id,
      name: `${t.name} ${t.surname}`,
    })),
    terms: terms.map((t) => ({
      id: t.id,
      name: t.name,
      current: t.current,
    })),
  };
}

// ============================================================
// TIMETABLE QUERIES (by role)
// ============================================================

/**
 * Get timetable for a specific class in a term
 * Used by: Admin, Student dashboard
 */
export async function getTimetableByClass(classId: number, termId: number): Promise<TimetableSlot[]> {
  const lessons = await prisma.lesson.findMany({
    where: { classId, termId },
    include: {
      subject: true,
      class: true,
      teacher: { select: { id: true, name: true, surname: true } },
      term: true,
      topics: { orderBy: { weekNumber: "asc" } },
    },
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });

  return lessons.map(mapLessonToSlot);
}

/**
 * Get timetable for a specific teacher in a term
 * Used by: Teacher dashboard
 */
export async function getTimetableByTeacher(teacherId: string, termId: number): Promise<TimetableSlot[]> {
  const lessons = await prisma.lesson.findMany({
    where: { teacherId, termId },
    include: {
      subject: true,
      class: true,
      teacher: { select: { id: true, name: true, surname: true } },
      term: true,
      topics: { orderBy: { weekNumber: "asc" } },
    },
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });

  return lessons.map(mapLessonToSlot);
}

/**
 * Get timetable for a student (by their class) in a term
 * Used by: Student dashboard
 */
export async function getTimetableByStudent(studentId: string, termId: number): Promise<TimetableSlot[]> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { classId: true },
  });

  if (!student) return [];

  return getTimetableByClass(student.classId, termId);
}

/**
 * Get ALL lessons for admin view, grouped by class
 * Used by: Admin timetable management
 */
export async function getAllTimetables(termId: number) {
  const lessons = await prisma.lesson.findMany({
    where: { termId },
    include: {
      subject: true,
      class: true,
      teacher: { select: { id: true, name: true, surname: true } },
      term: true,
      topics: { orderBy: { weekNumber: "asc" } },
    },
    orderBy: [{ class: { name: "asc" } }, { day: "asc" }, { startTime: "asc" }],
  });

  // Group by class
  const grouped: Record<string, TimetableSlot[]> = {};
  for (const lesson of lessons) {
    const className = lesson.class.name;
    if (!grouped[className]) {
      grouped[className] = [];
    }
    grouped[className].push(mapLessonToSlot(lesson));
  }

  return grouped;
}

/**
 * Get topics for a specific lesson
 */
export async function getLessonTopics(lessonId: number) {
  return prisma.lessonTopic.findMany({
    where: { lessonId },
    orderBy: { weekNumber: "asc" },
  });
}

/**
 * Get a single lesson by ID with all relations
 */
export async function getLessonById(id: number): Promise<LessonWithRelations | null> {
  return prisma.lesson.findUnique({
    where: { id },
    include: {
      subject: true,
      class: true,
      teacher: { select: { id: true, name: true, surname: true } },
      term: true,
      topics: { orderBy: { weekNumber: "asc" } },
    },
  });
}

/**
 * Get available time slots (periods) for the timetable grid
 */
export function getTimeSlots(): { start: string; end: string; label: string }[] {
  return [
    { start: "08:00", end: "08:45", label: "Period 1 (8:00 - 8:45)" },
    { start: "09:00", end: "09:45", label: "Period 2 (9:00 - 9:45)" },
    { start: "10:00", end: "10:45", label: "Period 3 (10:00 - 10:45)" },
    { start: "11:00", end: "11:45", label: "Period 4 (11:00 - 11:45)" },
    { start: "13:00", end: "13:45", label: "Period 5 (13:00 - 13:45)" },
    { start: "14:00", end: "14:45", label: "Period 6 (14:00 - 14:45)" },
    { start: "15:00", end: "15:45", label: "Period 7 (15:00 - 15:45)" },
  ];
}

/**
 * Get the days of the week
 */
export function getWeekDays(): { value: string; label: string }[] {
  return [
    { value: "MONDAY", label: "Monday" },
    { value: "TUESDAY", label: "Tuesday" },
    { value: "WEDNESDAY", label: "Wednesday" },
    { value: "THURSDAY", label: "Thursday" },
    { value: "FRIDAY", label: "Friday" },
  ];
}


import { DAYS, PERIODS, type TimetableData, type TimetableEntry } from "@/component/TimetableClient";

export function mapSlotsToTimetableGrid(slots: TimetableSlot[]): TimetableData {
  const timetable: TimetableData = {};
  
  // Initialize all days with empty periods
  for (const day of DAYS) {
    timetable[day] = {};
    for (const period of PERIODS) {
      timetable[day][period.time] = null;
    }
  }

  // Fill in the lessons
  for (const slot of slots) {
    const day = slot.day.charAt(0).toUpperCase() + slot.day.slice(1).toLowerCase();
    const timeKey = `${slot.startTime} - ${slot.endTime}`;
    
    if (timetable[day] && timetable[day][timeKey] !== undefined) {
      timetable[day][timeKey] = {
        id: slot.id,
        subject: slot.subject,
        group: slot.class,
        person: slot.teacher,
        room: "TBD", // Add room to your Lesson model if needed
        lessonName: slot.name,
      };
    }
  }

  return timetable;
}