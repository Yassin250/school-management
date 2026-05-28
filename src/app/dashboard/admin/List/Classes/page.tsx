// src/app/dashboard/admin/List/Classes/page.tsx
import { prisma } from "@/lib/prisma";
import ClassesListClient from "./ClassesListClient";

export default async function ClassesListPage() {
  const classes = await prisma.class.findMany({
    include: {
      grade: {
        select: { level: true },
      },
      supervisor: {
        select: { name: true, surname: true },
      },
      _count: {
        select: { students: true },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const formattedClasses = classes.map((cls) => ({
    id: cls.id,
    name: cls.name,
    capacity: cls.capacity,
    grade: `Grade ${cls.grade.level}`,
    supervisor: cls.supervisor
      ? `${cls.supervisor.name} ${cls.supervisor.surname}`
      : "Not assigned",
    students: cls._count.students,
  }));

  return <ClassesListClient data={formattedClasses} />;
}