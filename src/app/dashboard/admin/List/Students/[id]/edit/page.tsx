// src/app/dashboard/admin/List/Students/[id]/edit/page.tsx
import StudentForm from "@/component/forms/StudentForm";
import { getStudentRelatedData, mapStudentToFormData } from "@/lib/data/student";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [student, relatedData] = await Promise.all([
    prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
        grade: true,
        parent: true,
      },
    }),
    getStudentRelatedData(),
  ]);

  if (!student) {
    notFound();
  }

  const formData = mapStudentToFormData(student);

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link
        href="/dashboard/admin/list/students"
        className="text-sm text-blue-600 hover:underline w-fit"
      >
        ← Back to students
      </Link>
      <StudentForm mode="update" data={formData} relatedData={relatedData} />
    </div>
  );
}