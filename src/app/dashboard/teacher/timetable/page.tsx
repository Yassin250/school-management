// src/app/dashboard/teacher/timetable/page.tsx
import { auth } from "@/auth";
import TimetableClient, { type TimetableData } from "@/component/TimetableClient";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function TeacherTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ termId?: string }>;
}) {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const { termId: termIdParam } = await searchParams;
  const selectedTermId = termIdParam ? Number(termIdParam) : undefined;

  const terms = await prisma.term.findMany({
    orderBy: { startDate: "asc" },
  });

  const activeTerm =
    terms.find((t) => t.id === selectedTermId) ||
    terms.find((t) => t.current) ||
    terms[0];

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      subjects: true,
      lessons: {
        where: activeTerm ? { termId: activeTerm.id } : undefined,
        include: {
          subject: true,
          class: true,
        },
        orderBy: [{ day: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!teacher) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Teacher not found</h1>
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

  const classNames = new Set<string>();

  teacher.lessons.forEach((lesson) => {
    const dayName = dayMap[lesson.day];
    if (!dayName) return;

    const startStr =
      lesson.startTime.getUTCHours().toString().padStart(2, "0") +
      ":" +
      lesson.startTime.getUTCMinutes().toString().padStart(2, "0");
    const endStr =
      lesson.endTime.getUTCHours().toString().padStart(2, "0") +
      ":" +
      lesson.endTime.getUTCMinutes().toString().padStart(2, "0");
    const timeSlot = `${startStr} - ${endStr}`;

    classNames.add(lesson.class.name);
    timetable[dayName][timeSlot] = {
      id: lesson.id,
      subject: lesson.subject.name,
      group: `Class ${lesson.class.name}`,
      room: String(100 + (lesson.id % 20)),
      lessonName: lesson.name,
    };
  });

  const lessonIds = teacher.lessons.map((l) => l.id);
  const topics = await prisma.lessonTopic.findMany({
    where: { lessonId: { in: lessonIds } },
  });

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

  const teacherName = `${teacher.name} ${teacher.surname}`;

  return (
    <TimetableClient
      title="My Timetable"
      subtitle={`${teacherName} • Weekly teaching schedule`}
      backHref="/dashboard/teacher"
      backLabel="Back to Dashboard"
      timetable={timetable}
      stats={{
        totalLessons: teacher.lessons.length,
        subjectsCount: teacher.subjects.length,
        groupsCount: classNames.size,
        groupsLabel: "Classes",
      }}
      terms={formattedTerms}
      selectedTermId={activeTerm?.id}
      isTeacher={true}
      initialTopics={formattedTopics}
    />
  );
}
