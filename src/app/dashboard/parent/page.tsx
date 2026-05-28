"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { parentsData, studentsData } from "@/lib/mockData";
import { Users, GraduationCap, Clock, TrendingUp, DollarSign, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ParentDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const parentId = session?.user?.id || "1"; 
  const parent = parentsData.find((p) => p.id === parentId);

  if (!parent) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Parent not found</h1>
        <Link href="/login" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          ← Back to Login
        </Link>
      </div>
    );
  }

  // Get full child details
  const myChildren = studentsData.filter((s) => parent.children.includes(s.name));
  const [selectedChildId, setSelectedChildId] = useState<string>(myChildren[0]?.id || "");
  const selectedChild = myChildren.find((c) => c.id === selectedChildId) || myChildren[0];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ========== HEADER ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xl font-bold">
            {parent.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {parent.name.split(" ")[0]}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {myChildren.length} {myChildren.length === 1 ? "child" : "children"} enrolled
            </p>
          </div>
        </div>
      </div>

      {/* ========== CHILD SELECTOR ========== */}
      {myChildren.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {myChildren.map((child) => (
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
                <p className="text-xs text-gray-500">Class {child.class}</p>
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
                <p className="text-sm text-gray-500">Class {selectedChild.class} • Grade {selectedChild.grade}</p>
                <p className="text-xs text-gray-400">Student ID: {selectedChild.studentId}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <Clock className="w-5 h-5 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">92%</p>
              <p className="text-xs text-gray-500">Attendance</p>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: "92%" }} />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">B+</p>
              <p className="text-xs text-gray-500">Avg Grade</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <DollarSign className="w-5 h-5 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">$800</p>
              <p className="text-xs text-gray-500">Pending Fees</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <Calendar className="w-5 h-5 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">3</p>
              <p className="text-xs text-gray-500">Upcoming Exams</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href={`/dashboard/parent/children/${selectedChild.id}/attendance`}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center hover:bg-blue-50 transition-colors group"
            >
              <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-gray-700">Attendance</p>
              <ChevronRight className="w-4 h-4 text-gray-300 mx-auto mt-1 group-hover:text-blue-500" />
            </Link>
            <Link
              href={`/dashboard/parent/children/${selectedChild.id}/grades`}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center hover:bg-green-50 transition-colors group"
            >
              <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-gray-700">Grades</p>
              <ChevronRight className="w-4 h-4 text-gray-300 mx-auto mt-1 group-hover:text-green-500" />
            </Link>
            <Link
              href={`/dashboard/parent/children/${selectedChild.id}/fees`}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center hover:bg-amber-50 transition-colors group"
            >
              <DollarSign className="w-6 h-6 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-gray-700">Fees</p>
              <ChevronRight className="w-4 h-4 text-gray-300 mx-auto mt-1 group-hover:text-amber-500" />
            </Link>
            <Link
              href={`/dashboard/parent/messages`}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center hover:bg-purple-50 transition-colors group"
            >
              <Users className="w-6 h-6 text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-gray-700">Message Teacher</p>
              <ChevronRight className="w-4 h-4 text-gray-300 mx-auto mt-1 group-hover:text-purple-500" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}