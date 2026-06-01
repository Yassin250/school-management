// src/app/dashboard/student/timetable/page.tsx
import { auth } from "@/auth";
import TimetableClient, { type TimetableData } from "@/component/TimetableClient";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function StudentTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ termId?: string }>;
}) {
  const session = await auth();
  const studentId = session?.user?.id;

  if (!studentId) {
    redirect("/login");
  }

  const { termId: termIdParam } = await searchParams;
  const selectedTermId = termIdParam ? Number(termIdParam) : undefined;

  // Fetch all terms
  const terms = await prisma.term.findMany({
    orderBy: { startDate: "asc" },
  });

  const activeTerm = terms.find((t) => t.id === selectedTermId) || terms.find((t) => t.current) || terms[0];

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: {
        include: {
          lessons: {
            where: {
              termId: activeTerm?.id,
            },
            include: {
              subject: true,
              teacher: true,
            },
          },
        },
      },
      grade: true,
    },
  });

  if (!student) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Student not found</h1>
      </div>
    );
  }

  const dayMap: Record<string, string> = {
    MONDAY: "Monday",
    TUESDAY: "Tuesday",
    WEDNESDAY: "Wednesday",
    THURSDAY: "Thursday",
    FRIDAY: "Friday",
  };

  const timetable: TimetableData = {
    Monday: {},
    Tuesday: {},
    Wednesday: {},
    Thursday: {},
    Friday: {},
  };

  const subjectNames = new Set<string>();

  student.class.lessons.forEach((lesson) => {
    const dayName = dayMap[lesson.day];
    if (!dayName) return;

    // Use UTC for consistent display formatting
    const startStr = lesson.startTime.getUTCHours().toString().padStart(2, "0") + ":" + lesson.startTime.getUTCMinutes().toString().padStart(2, "0");
    const endStr = lesson.endTime.getUTCHours().toString().padStart(2, "0") + ":" + lesson.endTime.getUTCMinutes().toString().padStart(2, "0");
    const timeSlot = `${startStr} - ${endStr}`;

    subjectNames.add(lesson.subject.name);
    timetable[dayName][timeSlot] = {
      id: lesson.id,
      subject: lesson.subject.name,
      group: student.class.name,
      person: `${lesson.teacher.name} ${lesson.teacher.surname}`,
      room: String(100 + (lesson.id % 20)),
      lessonName: lesson.name,
    };
  });

  // Fetch topics for these lessons
  const lessonIds = student.class.lessons.map((l) => l.id);
  const topics = await prisma.lessonTopic.findMany({
    where: {
      lessonId: { in: lessonIds },
    },
  });

  const studentName = `${student.name} ${student.surname}`;

  const formattedTerms = terms.map((t) => ({
    id: t.id,
    name: t.name,
    startDate: t.startDate.toISOString().split("T")[0],
    endDate: t.endDate.toISOString().split("T")[0],
    current: t.current,
  }));

  const formattedTopics = topics.map((tp) => ({
    id: tp.id,
    lessonId: tp.lessonId,
    weekNumber: tp.weekNumber,
    topic: tp.topic,
  }));

  return (
    <TimetableClient
      title="My Timetable"
      subtitle={`${studentName} | Grade ${student.grade.level} | Class ${student.class.name}`}
      backHref="/dashboard/student"
      backLabel="Back to Dashboard"
      timetable={timetable}
      stats={{
        totalLessons: student.class.lessons.length,
        subjectsCount: subjectNames.size,
        groupsCount: 1,
        groupsLabel: "Class",
      }}
      terms={formattedTerms}
      selectedTermId={activeTerm?.id}
      isTeacher={false}
      initialTopics={formattedTopics}
    />
  );
}
