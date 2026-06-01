// src/app/dashboard/teacher/attendance/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import TeacherAttendanceClient from "@/component/TeacherAttendanceClient";
import { redirect } from "next/navigation";

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  // Get teacher's supervised classes and the classes they teach in
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      supervisedClasses: true,
      lessons: {
        include: {
          class: true,
        },
      },
    },
  });

  if (!teacher) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Teacher not found</h1>
      </div>
    );
  }

  // Extract unique classes
  const classesSet = new Set<string>();
  teacher.supervisedClasses.forEach((c) => classesSet.add(c.name));
  teacher.lessons.forEach((l) => {
    if (l.class) classesSet.add(l.class.name);
  });
  const classes = Array.from(classesSet);

  // Parse search parameters
  const resolvedSearchParams = await searchParams;
  const selectedClass = resolvedSearchParams.class || classes[0] || "";
  const selectedDate = resolvedSearchParams.date || new Date().toISOString().split("T")[0];
  const queryLessonId = resolvedSearchParams.lessonId;

  // If no classes, display empty state
  if (!selectedClass) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">No classes assigned</h1>
        <p className="text-sm text-gray-500 mt-1">You are not assigned to teach or supervise any classes.</p>
      </div>
    );
  }

  // Find class record in DB
  const classRecord = await prisma.class.findUnique({
    where: { name: selectedClass },
  });

  if (!classRecord) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Class not found</h1>
      </div>
    );
  }

  // Determine the day of the week for the query
  const dateObj = new Date(selectedDate);
  const jsDay = dateObj.getDay(); // 0: Sunday, 1: Monday, ... 6: Saturday
  
  const dayMap: Record<number, "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY"> = {
    1: "MONDAY",
    2: "TUESDAY",
    3: "WEDNESDAY",
    4: "THURSDAY",
    5: "FRIDAY",
  };
  
  // Default weekend days to MONDAY for scheduling query convenience
  const dayOfWeekEnum = dayMap[jsDay] || "MONDAY";

  // Find lessons for this class, teacher, and day of week
  const lessonsFromDb = await prisma.lesson.findMany({
    where: {
      classId: classRecord.id,
      teacherId: teacherId,
      day: dayOfWeekEnum,
    },
    include: {
      subject: true,
    },
  });

  const lessons = lessonsFromDb.map((l) => ({
    id: l.id,
    name: l.name,
    startTime: l.startTime.getUTCHours().toString().padStart(2, '0') + ":" + l.startTime.getUTCMinutes().toString().padStart(2, '0'),
    endTime: l.endTime.getUTCHours().toString().padStart(2, '0') + ":" + l.endTime.getUTCMinutes().toString().padStart(2, '0'),
  }));

  // Determine active/selected lesson ID
  const selectedLessonId = queryLessonId 
    ? parseInt(queryLessonId) 
    : lessons[0]?.id || null;

  // Get students in this class
  const studentsFromDb = await prisma.student.findMany({
    where: { classId: classRecord.id },
    orderBy: { name: "asc" },
  });

  const students = studentsFromDb.map((s) => ({
    id: s.id,
    name: s.name,
    surname: s.surname,
    username: s.username,
    sex: s.sex,
  }));

  // Fetch existing attendance records
  const existingAttendanceMap: Record<string, boolean> = {};
  if (selectedLessonId) {
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        lessonId: selectedLessonId,
        date: new Date(selectedDate),
      },
    });
    attendanceRecords.forEach((rec) => {
      existingAttendanceMap[rec.studentId] = rec.present;
    });
  }

  const teacherName = `${teacher.name} ${teacher.surname}`;

  return (
    <TeacherAttendanceClient
      teacherName={teacherName}
      classes={classes}
      selectedClass={selectedClass}
      selectedDate={selectedDate}
      lessons={lessons}
      selectedLessonId={selectedLessonId}
      students={students}
      existingAttendance={existingAttendanceMap}
    />
  );
}