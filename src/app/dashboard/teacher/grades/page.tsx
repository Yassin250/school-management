// src/app/dashboard/teacher/grades/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import TeacherGradesClient from "@/component/TeacherGradesClient";
import { redirect } from "next/navigation";

export default async function TeacherGradesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
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
          subject: true,
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

  const resolvedSearchParams = await searchParams;
  const gradingType = (resolvedSearchParams.type as "exam" | "assignment") || "exam";
  const queryItemId = resolvedSearchParams.itemId ?? resolvedSearchParams.exam;

  let selectedClass = resolvedSearchParams.class || classes[0] || "";
  let selectedSubject = resolvedSearchParams.subject || "";

  if (queryItemId && gradingType === "exam" && !selectedSubject) {
    const examRecord = await prisma.exam.findUnique({
      where: { id: Number(queryItemId) },
      include: {
        lesson: {
          include: { subject: true, class: true },
        },
      },
    });
    if (examRecord?.lesson) {
      selectedClass = examRecord.lesson.class.name;
      selectedSubject = examRecord.lesson.subject.name;
    }
  }

  const classRecord = await prisma.class.findUnique({
    where: { name: selectedClass },
  });

  const subjectsSet = new Set<string>();
  if (classRecord) {
    const classLessons = await prisma.lesson.findMany({
      where: {
        classId: classRecord.id,
        teacherId: teacherId,
      },
      include: {
        subject: true,
      },
    });
    classLessons.forEach((l) => {
      if (l.subject) subjectsSet.add(l.subject.name);
    });
  }
  const subjects = Array.from(subjectsSet);

  if (!selectedSubject) {
    selectedSubject = subjects[0] || "";
  }

  // Fetch exams or assignments for this Class and Subject
  let items: { id: number; title: string }[] = [];
  if (classRecord && selectedSubject) {
    const subjectRecord = await prisma.subject.findUnique({
      where: { name: selectedSubject }
    });

    if (subjectRecord) {
      const lessons = await prisma.lesson.findMany({
        where: {
          classId: classRecord.id,
          subjectId: subjectRecord.id,
          teacherId: teacherId,
        }
      });
      const lessonIds = lessons.map(l => l.id);

      if (gradingType === "exam") {
        const exams = await prisma.exam.findMany({
          where: { lessonId: { in: lessonIds } }
        });
        items = exams.map(e => ({ id: e.id, title: e.title }));
      } else {
        const assignments = await prisma.assignment.findMany({
          where: { lessonId: { in: lessonIds } }
        });
        items = assignments.map(a => ({ id: a.id, title: a.title }));
      }
    }
  }

  // Determine selected item ID
  const selectedItemId = queryItemId 
    ? parseInt(queryItemId) 
    : items[0]?.id || null;

  // Fetch students in this class
  let students: { id: string; name: string; surname: string; username: string; sex: "MALE" | "FEMALE" }[] = [];
  if (classRecord) {
    const studentsFromDb = await prisma.student.findMany({
      where: { classId: classRecord.id },
      orderBy: { name: "asc" }
    });
    students = studentsFromDb.map(s => ({
      id: s.id,
      name: s.name,
      surname: s.surname,
      username: s.username,
      sex: s.sex,
    }));
  }

  // Fetch existing grades/results
  const existingGradesMap: Record<string, number> = {};
  if (selectedItemId) {
    const results = await prisma.result.findMany({
      where: {
        ...(gradingType === "exam" ? { examId: selectedItemId } : { assignmentId: selectedItemId })
      }
    });
    results.forEach(res => {
      existingGradesMap[res.studentId] = res.score;
    });
  }

  const teacherName = `${teacher.name} ${teacher.surname}`;

  return (
    <TeacherGradesClient
      teacherName={teacherName}
      classes={classes}
      subjects={subjects}
      selectedClass={selectedClass}
      selectedSubject={selectedSubject}
      gradingType={gradingType}
      selectedItemId={selectedItemId}
      items={items}
      students={students}
      existingGrades={existingGradesMap}
    />
  );
}