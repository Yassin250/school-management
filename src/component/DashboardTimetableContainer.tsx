// src/component/DashboardTimetableContainer.tsx
import { prisma } from "@/lib/prisma";
import TimetableClient, { type TimetableData } from "@/component/TimetableClient";

type Props = {
  type: "classId" | "teacherId";
  id: string;
  searchParams?: { termId?: string };
};

export default async function DashboardTimetableContainer({
  type,
  id,
  searchParams,
}: Props) {
  // Fetch all terms to let the user select
  const terms = await prisma.term.findMany({
    orderBy: { startDate: "asc" },
  });

  const termIdParam = searchParams?.termId ? Number(searchParams.termId) : undefined;
  const activeTerm = terms.find((t) => t.id === termIdParam) || terms.find((t) => t.current) || terms[0];

  // Retrieve lessons for this class/teacher and term
  const lessons = await prisma.lesson.findMany({
    where: {
      ...(activeTerm ? { termId: activeTerm.id } : {}),
      ...(type === "teacherId"
        ? { teacherId: id }
        : { classId: Number(id) }),
    },
    include: {
      subject: true,
      class: true,
      teacher: true,
    },
  });

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

  lessons.forEach((lesson) => {
    const dayName = dayMap[lesson.day];
    if (!dayName) return;

    // Use UTC times for consistent formatting
    const startStr = lesson.startTime.getUTCHours().toString().padStart(2, "0") + ":" + lesson.startTime.getUTCMinutes().toString().padStart(2, "0");
    const endStr = lesson.endTime.getUTCHours().toString().padStart(2, "0") + ":" + lesson.endTime.getUTCMinutes().toString().padStart(2, "0");
    const timeSlot = `${startStr} - ${endStr}`;

    timetable[dayName][timeSlot] = {
      id: lesson.id,
      subject: lesson.subject.name,
      group:
        type === "teacherId"
          ? `Class ${lesson.class.name}`
          : lesson.class.name,
      person:
        type === "teacherId"
          ? undefined
          : `${lesson.teacher.name} ${lesson.teacher.surname}`,
      room: String(100 + (lesson.id % 20)),
      lessonName: lesson.name,
    };
  });

  // Fetch topics for these lessons
  const lessonIds = lessons.map((l) => l.id);
  const topics = await prisma.lessonTopic.findMany({
    where: {
      lessonId: { in: lessonIds },
    },
  });

  // Calculate statistics
  const uniqueGroups = new Set<string>();
  const uniqueSubjects = new Set<string>();

  lessons.forEach((l) => {
    uniqueGroups.add(type === "teacherId" ? l.class.name : l.teacher.id);
    uniqueSubjects.add(l.subject.name);
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

  return (
    <TimetableClient
      title={type === "teacherId" ? "My Schedule" : "Class Schedule"}
      subtitle={type === "teacherId" ? "Personal weekly teaching slots" : "Weekly schedule of class lessons"}
      timetable={timetable}
      stats={{
        totalLessons: lessons.length,
        subjectsCount: uniqueSubjects.size,
        groupsCount: uniqueGroups.size,
        groupsLabel: type === "teacherId" ? "Classes" : "Teachers",
      }}
      isDashboard={true}
      terms={formattedTerms}
      selectedTermId={activeTerm?.id}
      isTeacher={type === "teacherId"}
      initialTopics={formattedTopics}
    />
  );
}
