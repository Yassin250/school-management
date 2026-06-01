// src/app/dashboard/teacher/students/[id]/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, GraduationCap, School, User, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TeacherStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const { id: studentId } = await params;

  // Find student in Prisma
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: {
        include: {
          grade: true,
        }
      },
      grade: true,
      attendances: true,
      results: true,
    }
  });

  if (!student) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Student not found</h1>
        <p className="text-sm text-gray-500 mt-1">No student found with ID: {studentId}</p>
        <Link href="/dashboard/teacher" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  // Check if this student belongs to teacher's class
  // (teacher is supervisor OR teaches in student's class)
  const isSupervisor = student.class.supervisorId === teacherId;
  const teachesClass = await prisma.lesson.findFirst({
    where: {
      classId: student.classId,
      teacherId: teacherId,
    },
  });

  if (!isSupervisor && !teachesClass) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <School className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Access Denied</h1>
        <p className="text-sm text-gray-500 mt-1">This student is not in a class assigned to you.</p>
        <Link href="/dashboard/teacher/my-classes" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          ← Back to My Classes
        </Link>
      </div>
    );
  }

  // Calculate attendance rate
  const totalAtt = student.attendances.length;
  const presentAtt = student.attendances.filter((a) => a.present).length;
  const attRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

  // Calculate avg score
  const totalScore = student.results.reduce((sum, r) => sum + r.score, 0);
  const totalRes = student.results.length;
  const avgScore = totalRes > 0 ? Math.round(totalScore / totalRes) : 0;

  const getLetterGrade = (score: number): string => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };
  const letterGrade = totalRes > 0 ? getLetterGrade(avgScore) : "N/A";

  // Fetch count of unique subjects this teacher teaches to this student (via class lessons)
  const teacherLessonsInStudentClass = await prisma.lesson.findMany({
    where: {
      classId: student.classId,
      teacherId: teacherId,
    },
    select: {
      subjectId: true,
    },
  });
  const uniqueSubjectsTaught = new Set(teacherLessonsInStudentClass.map((l) => l.subjectId)).size;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* ========== BACK BUTTON ========== */}
      <Link
        href={`/dashboard/teacher/my-classes/${student.class.name}/students`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Class Students
      </Link>

      {/* ========== PROFILE HEADER ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ${
            student.sex === "MALE" ? "bg-blue-500" : "bg-pink-500"
          }`}>
            {student.name.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{student.name} {student.surname}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                student.sex === "MALE" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"
              }`}>
                {student.sex}
              </span>
            </div>
            <p className="text-gray-500">{student.email || "No Email Listed"}</p>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm text-gray-400">ID: {student.id}</p>
              <span className="text-gray-300">|</span>
              <p className="text-sm text-gray-400">Class {student.class.name} • Grade {student.class.grade.level}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== INFO CARDS ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Information */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Contact Information
          </h3>
          <div className="space-y-3">
            {student.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">{student.email}</span>
              </div>
            )}
            {student.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">{student.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{student.address}</span>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Personal Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">Born: {new Date(student.birthday).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">Sex: {student.sex}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========== ACADEMIC INFO ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Academic Overview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50">
            <School className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Class {student.class.name}</p>
              <p className="text-xs text-gray-500">Current Class</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50">
            <GraduationCap className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Grade {student.grade.level}</p>
              <p className="text-xs text-gray-500">Grade Level</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50">
            <Clock className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">{attRate}%</p>
              <p className="text-xs text-gray-500">Attendance</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== QUICK STATS ========== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <GraduationCap className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{letterGrade}</p>
          <p className="text-xs text-gray-500">Average Grade</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Clock className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{attRate}%</p>
          <p className="text-xs text-gray-500">Attendance</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <TrendingUp className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{uniqueSubjectsTaught}</p>
          <p className="text-xs text-gray-500">Subjects</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Calendar className="w-5 h-5 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{student.results.length}</p>
          <p className="text-xs text-gray-500">Total Graded Items</p>
        </div>
      </div>

      {/* ========== ACTION BUTTONS ========== */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/dashboard/teacher/attendance?class=${student.class.name}`}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          View Attendance
        </Link>
        <Link
          href={`/dashboard/teacher/grades?class=${student.class.name}`}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
        >
          View Grades
        </Link>
      </div>
    </div>
  );
}