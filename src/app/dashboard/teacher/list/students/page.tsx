"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { teachersData, studentsData } from "@/lib/mockData";
import { ArrowLeft, Mail, Users, Search, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function TeacherAllStudentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // Get logged-in teacher
  const teacherId = session?.user?.id || "1";
  const teacher = teachersData.find((t) => t.id === teacherId);
  const myClassNames = teacher?.classes || [];

  // Get all students from teacher's classes
  const myStudents = studentsData.filter((s) => myClassNames.includes(s.class));

  // Search filter
  const filteredStudents = myStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const totalStudents = myStudents.length;
  const boys = myStudents.filter((s) => s.sex === "MALE").length;
  const girls = myStudents.filter((s) => s.sex === "FEMALE").length;

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
            <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
            <p className="text-sm text-gray-500 mt-1">
              {teacher.name} • {totalStudents} students across {myClassNames.length} classes
            </p>
          </div>
        </div>
      </div>

      {/* ========== STATS ========== */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Users className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
          <p className="text-xs text-gray-500">Total Students</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Users className="w-5 h-5 text-sky-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{boys}</p>
          <p className="text-xs text-gray-500">Boys</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Users className="w-5 h-5 text-pink-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{girls}</p>
          <p className="text-xs text-gray-500">Girls</p>
        </div>
      </div>

      {/* ========== SEARCH ========== */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, ID, or class..."
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* ========== EMPTY STATE ========== */}
      {myStudents.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Students</h3>
          <p className="text-sm text-gray-500">You don&apos;t have any students assigned yet.</p>
        </div>
      )}

      {/* ========== NO SEARCH RESULTS ========== */}
      {filteredStudents.length === 0 && searchTerm && (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No results</h3>
          <p className="text-sm text-gray-500">No students match &quot;{searchTerm}&quot;</p>
        </div>
      )}

      {/* ========== STUDENT LIST ========== */}
      {filteredStudents.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filteredStudents.map((student) => (
              <button
                key={student.id}
                onClick={() => router.push(`/dashboard/teacher/students/${student.id}`)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
              >
                {/* Left: Avatar + Info */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    student.sex === "MALE" ? "bg-blue-500" : "bg-pink-500"
                  }`}>
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {student.email}
                      </span>
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                        Class {student.class}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Quick Stats + Arrow */}
                <div className="hidden sm:flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">92%</p>
                    <p className="text-xs text-gray-400">Attendance</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">B+</p>
                    <p className="text-xs text-gray-400">Grade</p>
                  </div>
                  <GraduationCap className="w-4 h-4 text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}