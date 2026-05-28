// src/lib/formValidation.ts
import { z } from "zod";

// ========== TEACHER ==========
const teacherBaseSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9._]+$/, "Only letters, numbers, dots and underscores"),
  name: z.string().min(1, "First name is required!"),
  surname: z.string().min(1, "Surname is required!"),
  email: z.string().min(1, "Email is required!").email("Invalid email!"),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || val.length >= 10,
      "Phone must be at least 10 characters when provided"
    ),
  address: z.string().min(1, "Address is required!"),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  birthday: z
    .string()
    .min(1, "Birthday is required!")
    .refine((val) => !Number.isNaN(Date.parse(val)), "Invalid date"),
  img: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || z.string().url().safeParse(val).success,
      "Image must be a valid URL"
    ),
  subjects: z
    .array(z.coerce.number().int().positive())
    .min(1, "At least one subject is required!"),
  classes: z.array(z.coerce.number().int().positive()).default([]),
});

export const teacherCreateSchema = teacherBaseSchema
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm the password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const teacherUpdateSchema = teacherBaseSchema;

export type TeacherCreateFormData = z.infer<typeof teacherCreateSchema>;
export type TeacherUpdateFormData = z.infer<typeof teacherUpdateSchema>;


// ========== STUDENT (Create) ==========
// ========== STUDENT (Create) ==========
// Base fields shared between create and update
const studentBaseSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username too long")
    .regex(/^[a-zA-Z0-9._]+$/, "Only letters, numbers, dots, underscores"),
  name: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required" }),
  birthday: z.string().min(1, "Birthday is required"),
  img: z.string().optional().or(z.literal("")),
  classId: z.string().min(1, "Class is required"),
  gradeId: z.string().min(1, "Grade is required"),
  parentId: z.string().min(1, "Parent is required"),
});

// Create schema with password + confirmation
export const studentCreateSchema = studentBaseSchema
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm the password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type StudentCreateFormData = z.infer<typeof studentCreateSchema>;

// Update schema - uses base without password, adds id
export const studentUpdateSchema = studentBaseSchema.extend({
  id: z.string().min(1, "ID is required"),
});

export type StudentUpdateFormData = z.infer<typeof studentUpdateSchema>;


// ========== PARENT (Create) ==========
const parentBaseSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username too long")
    .regex(/^[a-zA-Z0-9._]+$/, "Only letters, numbers, dots, underscores"),
  name: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone must be at least 10 characters"),  // ✅ Required
  address: z.string().min(1, "Address is required"),
});

export const parentCreateSchema = parentBaseSchema
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm the password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ParentCreateFormData = z.infer<typeof parentCreateSchema>;

// ========== PARENT (Update) ==========
export const parentUpdateSchema = parentBaseSchema.extend({
  id: z.string().min(1, "ID is required"),
});

export type ParentUpdateFormData = z.infer<typeof parentUpdateSchema>;

// ========== CLASS (Create & Update) ==========
export const classSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().min(1, "Class name is required!"),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1!"),
  gradeId: z.coerce.number().int().positive("Grade is required!"),
  supervisorId: z.string().optional().or(z.literal("")),
});

export type ClassFormData = z.infer<typeof classSchema>;

// ========== SUBJECT (Create & Update) ==========
export const subjectSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().min(1, "Subject name is required!"),
  teachers: z.array(z.string()).min(1, "At least one teacher is required!"),
});

export type SubjectFormData = z.infer<typeof subjectSchema>;

// ========== EXAM (Create & Update) ==========
export const examSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  title: z.string().min(1, "Exam title is required!"),
  startTime: z.string().min(1, "Start time is required!"),
  endTime: z.string().min(1, "End time is required!"),
  lessonId: z.coerce.number().int().positive("Lesson is required!"),
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export type ExamFormData = z.infer<typeof examSchema>;

// ========== EVENT (Create & Update) ==========
export const eventSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  title: z.string().min(1, "Event title is required!"),
  description: z.string().min(10, "Description must be at least 10 characters!"),
  startTime: z.string().min(1, "Start time is required!"),
  endTime: z.string().min(1, "End time is required!"),
  classId: z.coerce.number().int().positive().optional().or(z.literal("")).or(z.literal(0)),
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export type EventFormData = z.infer<typeof eventSchema>;

// ========== ANNOUNCEMENT ==========
export const announcementSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required!"),
  description: z.string().min(10, "Description must be at least 10 characters!"),
  date: z.string().min(1, "Date is required!"),
});

export type AnnouncementFormData = z.infer<typeof announcementSchema>;