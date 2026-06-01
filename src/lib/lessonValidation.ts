// src/lib/lessonValidation.ts
import { z } from "zod";

export const termSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().min(1, "Term name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  current: z.boolean().default(false),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export type TermFormData = z.infer<typeof termSchema>;

export const lessonSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().min(1, "Lesson name is required"),
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], {
    errorMap: () => ({ message: "Please select a valid weekday" }),
  }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Start time must be HH:MM"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "End time must be HH:MM"),
  subjectId: z.coerce.number().int().positive("Subject is required"),
  classId: z.coerce.number().int().positive("Class is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  termId: z.coerce.number().int().positive("Term is required"),
}).refine((data) => {
  const [startH, startM] = data.startTime.split(":").map(Number);
  const [endH, endM] = data.endTime.split(":").map(Number);
  return (endH * 60 + endM) > (startH * 60 + startM);
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export type LessonFormData = z.infer<typeof lessonSchema>;

export const lessonTopicSchema = z.object({
  lessonId: z.coerce.number().int().positive(),
  weekNumber: z.coerce.number().int().min(1).max(20),
  topic: z.string().min(1, "Topic description is required"),
});

export type LessonTopicFormData = z.infer<typeof lessonTopicSchema>;
