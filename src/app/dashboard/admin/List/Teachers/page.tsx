import { prisma } from "@/lib/prisma";
import TeachersListClient from "./TeachersListClient";

export default async function TeachersListPage() {
  const teachers = await prisma.teacher.findMany({
    include: {
      subjects: true,
      supervisedClasses: true,
      lessons: {
        include: {
          class: true,
        },
      },
    },
  });

  const formattedTeachers = teachers.map((teacher) => {
    // Collect all unique class names (supervised classes + classes of lessons taught)
    const supervisedClassNames = teacher.supervisedClasses.map((c) => c.name);
    const lessonClassNames = teacher.lessons.map((l) => l.class.name);
    const uniqueClasses = Array.from(
      new Set([...supervisedClassNames, ...lessonClassNames])
    );

    return {
      id: teacher.id,
      name: `${teacher.name} ${teacher.surname}`,
      email: teacher.email || "",
      teacherId: teacher.username, // use unique username as Teacher ID representation
      subjects: teacher.subjects.map((s) => s.name),
      classes: uniqueClasses,
    };
  });

  return <TeachersListClient data={formattedTeachers} />;
}