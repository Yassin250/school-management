// src/app/dashboard/admin/List/Exams/[id]/edit/page.tsx
import ExamForm from "@/component/forms/ExamForm";
import { getExamRelatedData, mapExamToFormData } from "@/lib/data/exam";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const examId = parseInt(id);

  if (isNaN(examId)) {
    notFound();
  }

  const [exam, relatedData] = await Promise.all([
    prisma.exam.findUnique({
      where: { id: examId },
      include: {
        lesson: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    }),
    getExamRelatedData(),
  ]);

  if (!exam) {
    notFound();
  }

  const formData = mapExamToFormData(exam);

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link
        href="/dashboard/admin/list/exams"
        className="text-sm text-blue-600 hover:underline w-fit"
      >
        ← Back to exams
      </Link>
      <ExamForm mode="update" data={formData} relatedData={relatedData} />
    </div>
  );
}