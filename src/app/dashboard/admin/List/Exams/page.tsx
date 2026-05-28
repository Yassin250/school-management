// src/app/dashboard/admin/List/Exams/page.tsx
import { prisma } from "@/lib/prisma";
import ExamsListClient from "./ExamListClient";

export default async function ExamsListPage() {
  const exams = await prisma.exam.findMany({
    include: {
      lesson: {
        select: {
          name: true,
          subject: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
      _count: {
        select: { results: true },
      },
    },
    orderBy: {
      startTime: "desc",
    },
  });

  const formattedExams = exams.map((exam) => ({
    id: exam.id,
    title: exam.title,
    subject: exam.lesson.subject.name,
    class: exam.lesson.class.name,
    startTime: exam.startTime.toISOString(),
    endTime: exam.endTime.toISOString(),
    results: exam._count.results,
  }));

  return <ExamsListClient data={formattedExams} />;
}