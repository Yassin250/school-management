// src/app/dashboard/admin/List/Subjects/[id]/edit/page.tsx
import SubjectForm from "@/component/forms/SubjectForm";
import { getSubjectRelatedData, mapSubjectToFormData } from "@/lib/data/subject";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditSubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subjectId = parseInt(id);

  if (isNaN(subjectId)) {
    notFound();
  }

  const [subject, relatedData] = await Promise.all([
    prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        teachers: true,
      },
    }),
    getSubjectRelatedData(),
  ]);

  if (!subject) {
    notFound();
  }

  const formData = mapSubjectToFormData(subject);

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link
        href="/dashboard/admin/list/subjects"
        className="text-sm text-blue-600 hover:underline w-fit"
      >
        ← Back to subjects
      </Link>
      <SubjectForm mode="update" data={formData} relatedData={relatedData} />
    </div>
  );
}