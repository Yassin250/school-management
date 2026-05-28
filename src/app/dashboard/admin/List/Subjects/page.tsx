// src/app/dashboard/admin/List/Subjects/page.tsx
import { prisma } from "@/lib/prisma";
import SubjectsListClient from "./SubjectListClient";

export default async function SubjectsListPage() {
  const subjects = await prisma.subject.findMany({
    include: {
      teachers: {
        select: { id: true, name: true, surname: true },
      },
      _count: {
        select: { lessons: true },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const formattedSubjects = subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    teachers: subject.teachers.map((t) => `${t.name} ${t.surname}`),
    teacherCount: subject.teachers.length,
    lessonCount: subject._count.lessons,
  }));

  return <SubjectsListClient data={formattedSubjects} />;
}