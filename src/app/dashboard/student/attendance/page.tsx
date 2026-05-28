"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { studentsData } from "@/lib/mockData";
import { ArrowLeft, Clock, Check, X, Calendar, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type AttendanceRecord = {
  date: string;
  status: "present" | "absent" | "late";
  subject?: string;
};

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { date: "2026-05-01", status: "present", subject: "Math" },
  { date: "2026-05-02", status: "present", subject: "English" },
  { date: "2026-05-03", status: "late", subject: "Physics" },
  { date: "2026-05-04", status: "present", subject: "Chemistry" },
  { date: "2026-05-05", status: "absent", subject: "Biology" },
  { date: "2026-05-08", status: "present", subject: "Math" },
  { date: "2026-05-09", status: "present", subject: "English" },
  { date: "2026-05-10", status: "present", subject: "Physics" },
  { date: "2026-05-11", status: "late", subject: "Chemistry" },
  { date: "2026-05-12", status: "present", subject: "Biology" },
  { date: "2026-05-13", status: "present", subject: "Math" },
  { date: "2026-05-14", status: "present", subject: "History" },
];

export default function StudentAttendancePage() {
  const { data: session } = useSession();
  const studentId = session?.user?.id || "1";
  const student = studentsData.find((s) => s.id === studentId) || studentsData[0];

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Stats
  const totalDays = MOCK_ATTENDANCE.length;
  const presentDays = MOCK_ATTENDANCE.filter((a) => a.status === "present").length;
  const absentDays = MOCK_ATTENDANCE.filter((a) => a.status === "absent").length;
  const lateDays = MOCK_ATTENDANCE.filter((a) => a.status === "late").length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Calendar helpers
  const monthName = new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" });
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else { setCurrentMonth(currentMonth - 1); }
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else { setCurrentMonth(currentMonth + 1); }
  };

  const getDayStatus = (day: number): AttendanceRecord | undefined => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return MOCK_ATTENDANCE.find((a) => a.date === dateStr);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "present": return "bg-green-100 text-green-700";
      case "absent": return "bg-red-100 text-red-700";
      case "late": return "bg-amber-100 text-amber-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusDot = (status: string): string => {
    switch (status) {
      case "present": return "bg-green-500";
      case "absent": return "bg-red-500";
      case "late": return "bg-amber-500";
      default: return "bg-gray-300";
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* ========== BACK BUTTON ========== */}
      <Link href="/dashboard/student" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* ========== HEADER ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold ${
            student.sex === "MALE" ? "bg-blue-500" : "bg-pink-500"
          }`}>
            {student.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
            <p className="text-sm text-gray-500 mt-1">{student.name} • Class {student.class}</p>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 border border-green-100">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm">
            <span className="text-2xl font-bold text-green-600">{attendanceRate}%</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">Attendance Rate</p>
            <p className="text-sm text-gray-500">{presentDays} present out of {totalDays} days</p>
          </div>
        </div>
      </div>

      {/* ========== STATS ========== */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-2xl p-5 border border-green-100 text-center">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-700">{presentDays}</p>
          <p className="text-xs text-green-600">Present</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-5 border border-red-100 text-center">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
            <X className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-700">{absentDays}</p>
          <p className="text-xs text-red-600">Absent</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 text-center">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700">{lateDays}</p>
          <p className="text-xs text-amber-600">Late</p>
        </div>
      </div>

      {/* ========== ATTENDANCE CALENDAR ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900">{monthName} {currentYear}</h3>
          <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }, (_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const record = getDayStatus(day);

            return (
              <div
                key={day}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative ${
                  isToday ? "ring-2 ring-blue-500 font-bold" : ""
                } ${record ? getStatusColor(record.status) : "text-gray-500 hover:bg-gray-50"}`}
                title={record ? `${record.status.charAt(0).toUpperCase() + record.status.slice(1)}${record.subject ? ` - ${record.subject}` : ""}` : "No record"}
              >
                {day}
                {record && <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${getStatusDot(record.status)}`} />}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-full bg-green-500" /> Present
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-full bg-red-500" /> Absent
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-full bg-amber-500" /> Late
          </div>
        </div>
      </div>

      {/* ========== RECENT RECORDS ========== */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Recent Attendance</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {MOCK_ATTENDANCE.slice(-7).reverse().map((record, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${getStatusColor(record.status)}`}>
                  {record.status === "present" && <Check className="w-4 h-4" />}
                  {record.status === "absent" && <X className="w-4 h-4" />}
                  {record.status === "late" && <Clock className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">{record.status}</p>
                  <p className="text-xs text-gray-400">{record.subject || "General"}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(record.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}