// src/lib/data/exam.ts
import { prisma } from "@/lib/prisma";
import type { Exam, Lesson, Subject, Class } from "@/generated/prisma/client";

export async function getExamRelatedData() {
  const lessons = await prisma.lesson.findMany({
    select: {
      id: true,
      name: true,
      subject: { select: { name: true } },
      class: { select: { name: true } },
    },
    orderBy: { subject: { name: "asc" } },
  });

  return {
    lessons: lessons.map((l) => ({
      id: l.id,
      name: `${l.name} (${l.subject.name} - ${l.class.name})`,
    })),
  };
}

export function mapExamToFormData(
  exam: Exam & { lesson: Lesson & { subject: Subject; class: Class } }
) {
  return {
    id: exam.id,
    title: exam.title,
    startTime: exam.startTime.toISOString().slice(0, 16), // Format for datetime-local input
    endTime: exam.endTime.toISOString().slice(0, 16),
    lessonId: exam.lessonId,
  };
}

export type ExamFormInitialData = ReturnType<typeof mapExamToFormData>;