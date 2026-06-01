// src/app/dashboard/parent/ParentDashboardClient.tsx
"use client";

import { useState } from "react";
import { Clock, TrendingUp, DollarSign, Calendar, ChevronRight, GraduationCap } from "lucide-react";
import Link from "next/link";

type ChildData = {
  id: string;
  name: string;
  className: string;
  gradeLevel: number;
  sex: string;
  attendance: number;
  avgGrade: number;
  studentId: string;
};

type Props = {
  parentName: string;
  parentEmail: string;
  children: ChildData[];
};

function getAttendanceColor(percent: number) {
  if (percent >= 90) return "text-green-600 bg-green-50";
  if (percent >= 80) return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
}

function getGradeColor(score: number) {
  if (score >= 80) return "text-green-600 bg-green-50";
  if (score >= 60) return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
}

export default function ParentDashboardClient({ parentName, parentEmail, children }: Props) {
  const [selectedChildId, setSelectedChildId] = useState<string>(children[0]?.id ?? "");

  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0];

  if (children.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto text-center">
        <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900">No children enrolled</h1>
        <p className="text-sm text-gray-500 mt-2">
          Please contact the school administration to enroll your children.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ========== HEADER ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xl font-bold">
            {parentName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {parentName.split(" ")[0]}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {children.length} {children.length === 1 ? "child" : "children"} enrolled
            </p>
          </div>
        </div>
      </div>

      {/* ========== CHILD SELECTOR ========== */}
      {children.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all min-w-[200px] ${
                selectedChildId === child.id
                  ? "border-teal-500 bg-teal-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                child.sex === "MALE" ? "bg-blue-500" : "bg-pink-500"
              }`}>
                {child.name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">{child.name}</p>
                <p className="text-xs text-gray-500">Class {child.className}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ========== SELECTED CHILD OVERVIEW ========== */}
      {selectedChild && (
        <>
          {/* Child Header */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${
                selectedChild.sex === "MALE" ? "bg-blue-500" : "bg-pink-500"
              }`}>
                {selectedChild.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedChild.name}</h2>
                <p className="text-sm text-gray-500">
                  Class {selectedChild.className} • Grade {selectedChild.gradeLevel}
                </p>
                <p className="text-xs text-gray-400">ID: {selectedChild.studentId}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              href={`/dashboard/parent/attendance`}
              className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow`}
            >
              <Clock className={`w-5 h-5 mx-auto mb-2 ${getAttendanceColor(selectedChild.attendance).split(" ")[0]}`} />
              <p className="text-2xl font-bold text-gray-900">{selectedChild.attendance}%</p>
              <p className="text-xs text-gray-500">Attendance</p>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    selectedChild.attendance >= 90 ? "bg-green-500" : selectedChild.attendance >= 80 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${selectedChild.attendance}%` }}
                />
              </div>
            </Link>

            <Link
              href={`/dashboard/parent/grades`}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow"
            >
              <TrendingUp className={`w-5 h-5 mx-auto mb-2 ${getGradeColor(selectedChild.avgGrade).split(" ")[0]}`} />
              <p className="text-2xl font-bold text-gray-900">{selectedChild.avgGrade}%</p>
              <p className="text-xs text-gray-500">Avg Grade</p>
            </Link>

            <Link
              href={`/dashboard/parent/fees`}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow"
            >
              <DollarSign className="w-5 h-5 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">--</p>
              <p className="text-xs text-gray-500">Fees</p>
            </Link>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <Calendar className="w-5 h-5 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">--</p>
              <p className="text-xs text-gray-500">Upcoming Exams</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/dashboard/parent/attendance"
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center hover:bg-blue-50 transition-colors group"
            >
              <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-gray-700">Attendance</p>
              <ChevronRight className="w-4 h-4 text-gray-300 mx-auto mt-1 group-hover:text-blue-500" />
            </Link>
            <Link
              href="/dashboard/parent/grades"
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center hover:bg-green-50 transition-colors group"
            >
              <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-gray-700">Grades</p>
              <ChevronRight className="w-4 h-4 text-gray-300 mx-auto mt-1 group-hover:text-green-500" />
            </Link>
            <Link
              href="/dashboard/parent/fees"
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center hover:bg-amber-50 transition-colors group"
            >
              <DollarSign className="w-6 h-6 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-gray-700">Fees</p>
              <ChevronRight className="w-4 h-4 text-gray-300 mx-auto mt-1 group-hover:text-amber-500" />
            </Link>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center group opacity-50 cursor-not-allowed">
              <Users className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Messages</p>
              <ChevronRight className="w-4 h-4 text-gray-300 mx-auto mt-1" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Need Users icon
import { Users } from "lucide-react";