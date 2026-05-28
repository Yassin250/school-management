// src/app/dashboard/admin/List/Classes/[id]/edit/page.tsx
import ClassForm from "@/component/forms/ClassForm";
import { getClassRelatedData, mapClassToFormData } from "@/lib/data/class";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classId = parseInt(id);

  if (isNaN(classId)) {
    notFound();
  }

  const [classData, relatedData] = await Promise.all([
    prisma.class.findUnique({
      where: { id: classId },
      include: {
        grade: true,
        supervisor: true,
      },
    }),
    getClassRelatedData(),
  ]);

  if (!classData) {
    notFound();
  }

  const formData = mapClassToFormData(classData);

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link
        href="/dashboard/admin/list/classes"
        className="text-sm text-blue-600 hover:underline w-fit"
      >
        ← Back to classes
      </Link>
      <ClassForm mode="update" data={formData} relatedData={relatedData} />
    </div>
  );
}