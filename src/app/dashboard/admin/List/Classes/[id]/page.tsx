// src/app/dashboard/admin/List/Classes/[id]/page.tsx
import ClassDetailView from "./ClassDetailView";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classId = parseInt(id);

  if (isNaN(classId)) {
    notFound();
  }

  const classData = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      grade: {
        select: { level: true },
      },
      supervisor: {
        select: { name: true, surname: true },
      },
      students: {
        select: {
          id: true,
          name: true,
          surname: true,
        },
        orderBy: {
          name: "asc",
        },
      },
      _count: {
        select: { lessons: true },
      },
    },
  });

  if (!classData) {
    notFound();
  }

  return (
    <ClassDetailView
      classData={{
        id: classData.id,
        name: classData.name,
        capacity: classData.capacity,
        grade: `Grade ${classData.grade.level}`,
        supervisor: classData.supervisor
          ? `${classData.supervisor.name} ${classData.supervisor.surname}`
          : "Not assigned",
        supervisorId: classData.supervisorId,
        students: classData.students.map((s) => ({
          id: s.id,
          name: `${s.name} ${s.surname}`,
        })),
        lessons: classData._count.lessons,
      }}
    />
  );
}