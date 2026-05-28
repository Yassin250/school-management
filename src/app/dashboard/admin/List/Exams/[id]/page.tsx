// src/app/dashboard/admin/List/Exams/[id]/page.tsx
import ExamDetailView from "./ExamDetailView";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const examId = parseInt(id);

  if (isNaN(examId)) {
    notFound();
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      lesson: {
        select: {
          name: true,
          subject: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
      results: {
        select: { score: true },
      },
      _count: {
        select: { results: true },
      },
    },
  });

  if (!exam) {
    notFound();
  }

  const averageScore =
    exam.results.length > 0
      ? Math.round(
          exam.results.reduce((sum, r) => sum + r.score, 0) /
            exam.results.length
        )
      : 0;

  return (
    <ExamDetailView
      exam={{
        id: exam.id,
        title: exam.title,
        subject: exam.lesson.subject.name,
        class: exam.lesson.class.name,
        lesson: exam.lesson.name,
        startTime: exam.startTime.toISOString(),
        endTime: exam.endTime.toISOString(),
        results: exam._count.results,
        averageScore,
      }}
    />
  );
}