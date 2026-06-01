// src/app/dashboard/teacher/assignments/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import TeacherAssignmentsClient from "@/component/TeacherAssignmentsClient";
import { redirect } from "next/navigation";

export default async function TeacherAssignmentsPage() {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  // Get teacher details
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      supervisedClasses: true,
      lessons: {
        include: {
          class: true,
        }
      }
    }
  });

  if (!teacher) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Teacher not found</h1>
      </div>
    );
  }

  // Fetch unique classes taught
  const classesSet = new Set<string>();
  teacher.supervisedClasses.forEach(c => classesSet.add(c.name));
  teacher.lessons.forEach(l => {
    if (l.class) classesSet.add(l.class.name);
  });
  const classes = Array.from(classesSet);

  // Fetch teacher's lessons to populate form
  const lessonsFromDb = await prisma.lesson.findMany({
    where: { teacherId: teacherId },
    include: {
      class: true,
      subject: true,
    }
  });

  const lessons = lessonsFromDb.map((l) => ({
    id: l.id,
    subjectName: l.subject.name,
    className: l.class.name,
  }));

  // Fetch assignments
  const assignmentsFromDb = await prisma.assignment.findMany({
    where: {
      lesson: {
        teacherId: teacherId,
      },
    },
    include: {
      lesson: {
        include: {
          class: {
            include: {
              students: true,
            }
          },
          subject: true,
        }
      },
      results: true,
    },
    orderBy: {
      dueDate: "desc",
    }
  });

  const initialAssignments = assignmentsFromDb.map((a) => ({
    id: a.id,
    title: a.title,
    subjectName: a.lesson.subject.name,
    className: a.lesson.class.name,
    dueDate: a.dueDate,
    totalSubmissions: a.results.length,
    totalStudents: a.lesson.class.students.length,
  }));

  const teacherName = `${teacher.name} ${teacher.surname}`;

  return (
    <TeacherAssignmentsClient
      teacherName={teacherName}
      lessons={lessons}
      classes={classes}
      initialAssignments={initialAssignments}
    />
  );
}