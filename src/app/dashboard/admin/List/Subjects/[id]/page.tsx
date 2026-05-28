// src/app/dashboard/admin/List/Subjects/[id]/page.tsx
import SubjectDetailView from "./SubjectDetailView";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subjectId = parseInt(id);

  if (isNaN(subjectId)) {
    notFound();
  }

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      teachers: {
        select: { id: true, name: true, surname: true },
        orderBy: { name: "asc" },
      },
      _count: {
        select: { lessons: true },
      },
    },
  });

  if (!subject) {
    notFound();
  }

  return (
    <SubjectDetailView
      subject={{
        id: subject.id,
        name: subject.name,
        teachers: subject.teachers.map((t) => ({
          id: t.id,
          name: `${t.name} ${t.surname}`,
        })),
        teacherCount: subject.teachers.length,
        lessonCount: subject._count.lessons,
      }}
    />
  );
}