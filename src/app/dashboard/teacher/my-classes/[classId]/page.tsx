// src/app/dashboard/teacher/my-classes/[classId]/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, School, Users, GraduationCap, Clock, BookOpen, TrendingUp } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TeacherClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const { classId } = await params; // classId is the className e.g. "1B"

  // Fetch class details
  const classInfo = await prisma.class.findUnique({
    where: { name: classId },
    include: {
      students: {
        include: {
          attendances: true,
          results: true,
        }
      },
      grade: true,
      supervisor: true,
    },
  });

  if (!classInfo) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Class not found</h1>
        <Link href="/dashboard/teacher/my-classes" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          ← Back to My Classes
        </Link>
      </div>
    );
  }

  // Verify access: Is the teacher the supervisor OR does the teacher teach any lessons in this class?
  const isSupervisor = classInfo.supervisorId === teacherId;
  const teachesClass = await prisma.lesson.findFirst({
    where: {
      classId: classInfo.id,
      teacherId: teacherId,
    },
  });

  if (!isSupervisor && !teachesClass) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Access Denied</h1>
        <p className="text-sm text-gray-500 mt-1">You are not assigned to this class.</p>
        <Link href="/dashboard/teacher/my-classes" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          ← Back to My Classes
        </Link>
      </div>
    );
  }

  // Calculate average attendance rate for class students
  let totalAttendanceSessions = 0;
  let totalPresentSessions = 0;
  classInfo.students.forEach((student) => {
    student.attendances.forEach((att) => {
      totalAttendanceSessions++;
      if (att.present) {
        totalPresentSessions++;
      }
    });
  });
  const avgAttendance = totalAttendanceSessions > 0
    ? Math.round((totalPresentSessions / totalAttendanceSessions) * 100)
    : 100;

  // Calculate average grade
  let totalScore = 0;
  let totalResults = 0;
  classInfo.students.forEach((student) => {
    student.results.forEach((res) => {
      totalScore += res.score;
      totalResults++;
    });
  });
  const avgScore = totalResults > 0 ? Math.round(totalScore / totalResults) : 0;

  const getLetterGrade = (score: number): string => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  const letterGrade = totalResults > 0 ? getLetterGrade(avgScore) : "N/A";

  // Fetch number of subjects teacher teaches in this class
  const teacherLessonsInClass = await prisma.lesson.findMany({
    where: {
      classId: classInfo.id,
      teacherId: teacherId,
    },
    select: {
      subjectId: true,
    },
  });
  const uniqueSubjectsTaught = new Set(teacherLessonsInClass.map((l) => l.subjectId)).size;

  const supervisorName = classInfo.supervisor 
    ? `${classInfo.supervisor.name} ${classInfo.supervisor.surname}` 
    : "N/A";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Link href="/dashboard/teacher/my-classes" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to My Classes
      </Link>

      {/* Class Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-xl bg-indigo-50 flex items-center justify-center">
            <School className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Class {classInfo.name}</h1>
            <p className="text-sm text-gray-500">Grade {classInfo.grade.level} • Supervisor: {supervisorName}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/teacher/my-classes/${classId}/students`}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700">
            View Students ({classInfo.students.length})
          </Link>
          <Link href={`/dashboard/teacher/attendance?class=${classId}`}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700">
            Take Attendance
          </Link>
          <Link href={`/dashboard/teacher/grades?class=${classId}`}
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700">
            Enter Grades
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <Users className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-xl font-bold">{classInfo.students.length}</p>
          <p className="text-xs text-gray-500">Students</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <Clock className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-xl font-bold">{avgAttendance}%</p>
          <p className="text-xs text-gray-500">Avg Attendance</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <TrendingUp className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-xl font-bold">{letterGrade}</p>
          <p className="text-xs text-gray-500">Avg Grade</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <BookOpen className="w-5 h-5 text-orange-500 mx-auto mb-2" />
          <p className="text-xl font-bold">{uniqueSubjectsTaught}</p>
          <p className="text-xs text-gray-500">Subjects Taught</p>
        </div>
      </div>
    </div>
  );
}