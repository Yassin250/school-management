"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { teachersData, classesData } from "@/lib/mockData";
import { ArrowLeft, School, Users, GraduationCap, BookOpen } from "lucide-react";
import Link from "next/link";

export default function TeacherMyClassesPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Get logged-in teacher
  const teacherId = session?.user?.id || "1";
  const teacher = teachersData.find((t) => t.id === teacherId);

  // Get teacher's assigned class names from mock data
  const myClassNames = teacher?.classes || [];

  // Get full class details from classesData
  const myClasses = classesData.filter((c) => myClassNames.includes(c.name));

  if (!teacher) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Teacher not found</h1>
        <Link href="/dashboard/teacher" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ========== BACK BUTTON ========== */}
      <Link
        href="/dashboard/teacher"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* ========== HEADER ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-bold">
            {teacher.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
            <p className="text-sm text-gray-500 mt-1">
              {teacher.name} • {myClasses.length} {myClasses.length === 1 ? "class" : "classes"} assigned
            </p>
          </div>
        </div>
      </div>

      {/* ========== STATS ========== */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <School className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{myClasses.length}</p>
          <p className="text-xs text-gray-500">Classes</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Users className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {myClasses.reduce((sum, c) => sum + c.capacity, 0)}
          </p>
          <p className="text-xs text-gray-500">Total Capacity</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <BookOpen className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{teacher.subjects.length}</p>
          <p className="text-xs text-gray-500">Subjects</p>
        </div>
      </div>

      {/* ========== EMPTY STATE ========== */}
      {myClasses.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <School className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Classes Assigned</h3>
          <p className="text-sm text-gray-500">You are not assigned to any classes yet. Contact the administrator.</p>
        </div>
      )}

      {/* ========== CLASS CARDS ========== */}
      {myClasses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myClasses.map((cls) => (
            <button
              key={cls.id}
              onClick={() => router.push(`/dashboard/teacher/my-classes/${cls.name}/students`)}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-left hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              {/* Class Icon */}
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <School className="w-6 h-6 text-indigo-600" />
              </div>

              {/* Class Name */}
              <h3 className="text-lg font-bold text-gray-900 mb-1">{cls.name}</h3>
              <p className="text-sm text-gray-500 mb-4">Grade {cls.grade} • Section {cls.section}</p>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{cls.capacity} students</span>
                </div>
                <div className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span>{cls.supervisor}</span>
                </div>
              </div>

              {/* View Link */}
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
                View Class
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}