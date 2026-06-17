import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TeacherDetailView from "./TeacherDetailView";

export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      subjects: { select: { name: true } },
      supervisedClasses: {
        select: { name: true, students: { select: { id: true } } },
      },
    },
  });

  if (!teacher) {
    notFound();
  }

  const subjects = teacher.subjects.map((s) => s.name);
  const classes = teacher.supervisedClasses.map((c) => c.name);
  const studentCount = teacher.supervisedClasses.reduce(
    (acc, c) => acc + c.students.length,
    0
  );

  return (
    <TeacherDetailView
      teacher={{
        id: teacher.id,
        name: `${teacher.name} ${teacher.surname}`,
        username: teacher.username,
        email: teacher.email ?? "",
        phone: teacher.phone ?? "",
        address: teacher.address,
        sex: teacher.sex,
        birthday: teacher.birthday.toISOString(),
        img: teacher.img ?? null,
        subjects,
        classes,
        studentCount,
        createdAt: new Date().toISOString(),
      }}
    />
  );
}