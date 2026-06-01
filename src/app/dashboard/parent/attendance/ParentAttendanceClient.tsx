// src/app/dashboard/parent/attendance/ParentAttendanceClient.tsx
"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle, XCircle, Clock, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";

type ChildAttendance = {
  id: string;
  name: string;
  className: string;
  sex: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendanceRate: number;
  monthlyAttendance: { month: string; rate: number }[];
  recentAttendance: {
    id: number;
    date: string;
    day: string;
    present: boolean;
    subject: string;
    lesson: string;
  }[];
};

type Props = {
  parentName: string;
  children: ChildAttendance[];
};

function getAttendanceColor(rate: number) {
  if (rate >= 90) return "text-green-600";
  if (rate >= 75) return "text-amber-600";
  return "text-red-600";
}

function getAttendanceBg(rate: number) {
  if (rate >= 90) return "bg-green-50 border-green-200";
  if (rate >= 75) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

export default function ParentAttendanceClient({ parentName, children }: Props) {
  const [selectedChildId, setSelectedChildId] = useState<string>(children[0]?.id ?? "");

  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0];

  if (children.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto text-center">
        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900">No children enrolled</h1>
        <Link href="/dashboard/parent" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/parent"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Attendance Records</h1>
            <p className="text-sm text-gray-500">View your children's attendance history</p>
          </div>
        </div>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all min-w-[200px] ${
                selectedChildId === child.id
                  ? "border-blue-500 bg-blue-50 shadow-md"
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

      {/* Selected Child Attendance */}
      {selectedChild && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className={`rounded-2xl p-5 border shadow-sm text-center ${getAttendanceBg(selectedChild.attendanceRate)}`}>
              <TrendingUp className={`w-5 h-5 mx-auto mb-2 ${getAttendanceColor(selectedChild.attendanceRate)}`} />
              <p className={`text-2xl font-bold ${getAttendanceColor(selectedChild.attendanceRate)}`}>
                {selectedChild.attendanceRate}%
              </p>
              <p className="text-xs text-gray-500">Attendance Rate</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{selectedChild.presentDays}</p>
              <p className="text-xs text-gray-500">Present Days</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <XCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{selectedChild.absentDays}</p>
              <p className="text-xs text-gray-500">Absent Days</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <Calendar className="w-5 h-5 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{selectedChild.totalDays}</p>
              <p className="text-xs text-gray-500">Total Records</p>
            </div>
          </div>

          {/* Monthly Trend */}
          {selectedChild.monthlyAttendance.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Monthly Trend</h3>
              <div className="flex items-end gap-3 h-40">
                {selectedChild.monthlyAttendance.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className={`text-xs font-bold ${getAttendanceColor(m.rate)}`}>{m.rate}%</span>
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        m.rate >= 90 ? "bg-green-400" : m.rate >= 75 ? "bg-amber-400" : "bg-red-400"
                      }`}
                      style={{ height: `${m.rate}%` }}
                    />
                    <span className="text-[10px] text-gray-400 font-medium">{m.month}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Attendance List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Recent Attendance ({selectedChild.recentAttendance.length} records)
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {selectedChild.recentAttendance.length > 0 ? (
                selectedChild.recentAttendance.map((record) => (
                  <div key={record.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      record.present ? "bg-green-100" : "bg-red-100"
                    }`}>
                      {record.present ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">{record.subject}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          record.present ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }`}>
                          {record.present ? "Present" : "Absent"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{record.lesson}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">{record.day}</p>
                      <p className="text-xs text-gray-400">{record.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No attendance records yet</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}