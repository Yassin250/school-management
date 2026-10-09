// ============================================================
// Timetable Shared Types & Constants
// Safe for both Server and Client Components
// ============================================================

export const DAYS_OF_WEEK = [
  { id: 1, name: "Monday", short: "Mon" },
  { id: 2, name: "Tuesday", short: "Tue" },
  { id: 3, name: "Wednesday", short: "Wed" },
  { id: 4, name: "Thursday", short: "Thu" },
  { id: 5, name: "Friday", short: "Fri" },
  { id: 6, name: "Saturday", short: "Sat" },
];

export const STANDARD_PERIODS = [
  { period: 1, label: "Period 1", startTime: "08:00", endTime: "08:45", isBreak: false },
  { period: 2, label: "Period 2", startTime: "08:45", endTime: "09:30", isBreak: false },
  { period: 3, label: "Period 3", startTime: "09:30", endTime: "10:15", isBreak: false },
  { period: 0, label: "Morning Break", startTime: "10:15", endTime: "10:45", isBreak: true },
  { period: 4, label: "Period 4", startTime: "10:45", endTime: "11:30", isBreak: false },
  { period: 5, label: "Period 5", startTime: "11:30", endTime: "12:15", isBreak: false },
  { period: 0, label: "Lunch Break", startTime: "12:15", endTime: "13:30", isBreak: true },
  { period: 6, label: "Period 6", startTime: "13:30", endTime: "14:15", isBreak: false },
  { period: 7, label: "Period 7", startTime: "14:15", endTime: "15:00", isBreak: false },
  { period: 8, label: "Period 8", startTime: "15:00", endTime: "15:45", isBreak: false },
];

export function timeToMinutes(time: string): number {
  const parts = time.split(":").map(Number);
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
    throw new Error(`Invalid time format '${time}'. Expected HH:mm (e.g. 08:30).`);
  }
  return parts[0] * 60 + parts[1];
}

export function rangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

export interface LessonConflict {
  type: "TEACHER" | "CLASS" | "ROOM";
  message: string;
  conflictingLessonId: string;
  conflictingClassName?: string;
  conflictingTeacherName?: string;
  conflictingSubjectName?: string;
  conflictingRoom?: string;
  timeSlot: string;
}

export interface CreateLessonInput {
  classId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  teacherId: string;
  subjectId?: string | null;
  moduleId?: string | null;
  room?: string | null;
  academicYearId?: string;
  termId?: string;
  timetableVersionId?: string;
}

export interface UpdateLessonInput {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  teacherId?: string;
  subjectId?: string | null;
  moduleId?: string | null;
  room?: string | null;
}
