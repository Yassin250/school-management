import TeacherForm from "@/component/forms/TeacherForm";
import { getTeacherRelatedData, mapTeacherToFormData } from "@/lib/data/teacher";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [teacher, relatedData] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id },
      include: {
        subjects: true,
        supervisedClasses: true,
      },
    }),
    getTeacherRelatedData(),
  ]);

  if (!teacher) {
    notFound();
  }

  const formData = mapTeacherToFormData(teacher);

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link
        href="/dashboard/admin/list/teachers"
        className="text-sm text-blue-600 hover:underline w-fit"
      >
        ← Back to teachers
      </Link>
      <TeacherForm mode="update" data={formData} relatedData={relatedData} />
    </div>
  );
}
