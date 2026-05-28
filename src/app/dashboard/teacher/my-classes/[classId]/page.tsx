"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { teachersData, classesData, studentsData } from "@/lib/mockData";
import { ArrowLeft, School, Users, GraduationCap, Clock, BookOpen, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function TeacherClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const classId = params.classId as string;

  const teacherId = session?.user?.id || "1";
  const teacher = teachersData.find((t) => t.id === teacherId);

  if (!teacher?.classes.includes(classId)) {
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

  const classInfo = classesData.find((c) => c.name === classId);
  const classStudents = studentsData.filter((s) => s.class === classId);

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
            <p className="text-sm text-gray-500">Grade {classInfo.grade} • Section {classInfo.section} • Supervisor: {classInfo.supervisor}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/teacher/my-classes/${classId}/students`}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700">
            View Students ({classStudents.length})
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
          <p className="text-xl font-bold">{classStudents.length}</p>
          <p className="text-xs text-gray-500">Students</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <Clock className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-xl font-bold">92%</p>
          <p className="text-xs text-gray-500">Avg Attendance</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <TrendingUp className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-xl font-bold">B+</p>
          <p className="text-xs text-gray-500">Avg Grade</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <BookOpen className="w-5 h-5 text-orange-500 mx-auto mb-2" />
          <p className="text-xl font-bold">{teacher.subjects.length}</p>
          <p className="text-xs text-gray-500">Subjects</p>
        </div>
      </div>
    </div>
  );
}