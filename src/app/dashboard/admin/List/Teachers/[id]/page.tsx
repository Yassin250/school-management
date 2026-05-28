import TeacherDetailView from "./TeacherDetailView";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      subjects: true,
      supervisedClasses: true,
      lessons: {
        include: { class: true },
      },
    },
  });

  if (!teacher) {
    notFound();
  }

  const supervisedClassNames = teacher.supervisedClasses.map((c) => c.name);
  const lessonClassNames = teacher.lessons.map((l) => l.class.name);
  const classes = Array.from(new Set([...supervisedClassNames, ...lessonClassNames]));

  const studentCount = await prisma.student.count({
    where: {
      classId: { in: teacher.supervisedClasses.map((c) => c.id) },
    },
  });

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
        img: teacher.img,
        subjects: teacher.subjects.map((s) => s.name),
        classes,
        studentCount,
        createdAt: teacher.createdAt.toISOString(),
      }}
    />
  );
}
