"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/session";
import {
  createLesson,
  updateLesson,
  deleteLesson,
} from "@/lib/services/timetable/timetable";

export interface SaveLessonState {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function saveLessonAction(
  prevState: SaveLessonState | null,
  formData: FormData,
): Promise<SaveLessonState> {
  try {
    const actor = await requireCurrentUser();

    const lessonId = (formData.get("lessonId") as string)?.trim();
    const classId = (formData.get("classId") as string)?.trim();
    const teacherId = (formData.get("teacherId") as string)?.trim();
    const subjectId = (formData.get("subjectId") as string)?.trim() || null;
    const moduleId = (formData.get("moduleId") as string)?.trim() || null;
    const dayOfWeekStr = formData.get("dayOfWeek") as string;
    const startTime = (formData.get("startTime") as string)?.trim();
    const endTime = (formData.get("endTime") as string)?.trim();
    const room = (formData.get("room") as string)?.trim() || null;

    if (!classId) return { error: "Class is required." };
    if (!teacherId) return { error: "Instructor / Teacher is required." };
    if (!dayOfWeekStr) return { error: "Day of week is required." };
    if (!startTime || !endTime) return { error: "Start time and End time are required." };

    const dayOfWeek = parseInt(dayOfWeekStr, 10);
    if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
      return { error: "Invalid day of week." };
    }

    if (lessonId) {
      await updateLesson(actor, lessonId, {
        dayOfWeek,
        startTime,
        endTime,
        teacherId,
        subjectId,
        moduleId,
        room,
      });
    } else {
      await createLesson(actor, {
        classId,
        dayOfWeek,
        startTime,
        endTime,
        teacherId,
        subjectId,
        moduleId,
        room,
      });
    }

    revalidatePath("/dashboard/timetable");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save lesson.";
    return { error: message };
  }
}

export async function deleteLessonAction(
  lessonId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const actor = await requireCurrentUser();
    await deleteLesson(actor, lessonId);
    revalidatePath("/dashboard/timetable");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete lesson.";
    return { error: message };
  }
}
