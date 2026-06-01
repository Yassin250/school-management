// src/app/dashboard/admin/List/Lessons/page.tsx
import { prisma } from "@/lib/prisma";
import LessonsListClient from "./LessonsListClient";

export default async function AdminLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ termId?: string; classId?: string }>;
}) {
  const resolved = await searchParams;
  const termId = resolved.termId ? Number(resolved.termId) : undefined;
  const classId = resolved.classId ? Number(resolved.classId) : undefined;

  const terms = await prisma.term.findMany({ orderBy: { startDate: "asc" } });
  const defaultTerm = terms.find((t) => t.current) ?? terms[0];

  const [classes, teachers, subjects, lessons] = await Promise.all([
    prisma.class.findMany({ orderBy: { name: "asc" } }),
    prisma.teacher.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.lesson.findMany({
      where: {
        ...(termId ? { termId } : defaultTerm ? { termId: defaultTerm.id } : {}),
        ...(classId ? { classId } : {}),
      },
      include: {
        class: true,
        subject: true,
        teacher: true,
        term: true,
        _count: { select: { topics: true, attendances: true } },
      },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    }),
  ]);

  const formattedTerms = terms.map((t) => ({
    id: t.id,
    name: t.name,
    startDate: t.startDate.toISOString().split("T")[0],
    endDate: t.endDate.toISOString().split("T")[0],
    current: t.current,
  }));

  const formattedClasses = classes.map((c) => ({ id: c.id, name: c.name }));
  const formattedTeachers = teachers.map((t) => ({ id: t.id, name: `${t.name} ${t.surname}` }));
  const formattedSubjects = subjects.map((s) => ({ id: s.id, name: s.name }));

  const formattedLessons = lessons.map((l) => ({
    id: l.id,
    name: l.name,
    day: l.day,
    startTime: `${l.startTime.getUTCHours().toString().padStart(2, "0")}:${l.startTime.getUTCMinutes().toString().padStart(2, "0")}`,
    endTime: `${l.endTime.getUTCHours().toString().padStart(2, "0")}:${l.endTime.getUTCMinutes().toString().padStart(2, "0")}`,
    classId: l.classId,
    className: l.class.name,
    subjectId: l.subjectId,
    subjectName: l.subject.name,
    teacherId: l.teacherId,
    teacherName: `${l.teacher.name} ${l.teacher.surname}`,
    termId: l.termId,
    termName: l.term?.name ?? "N/A",
    topicCount: l._count.topics,
    attendanceCount: l._count.attendances,
  }));

  const currentTerm = defaultTerm;

  return (
    <LessonsListClient
      terms={formattedTerms}
      classes={formattedClasses}
      teachers={formattedTeachers}
      subjects={formattedSubjects}
      lessons={formattedLessons}
      selectedTermId={termId ?? currentTerm?.id}
      selectedClassId={classId}
    />
  );
}