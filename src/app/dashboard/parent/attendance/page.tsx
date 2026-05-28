"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { parentsData, studentsData } from "@/lib/mockData";
import { ArrowLeft, Clock, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const MOCK_ATTENDANCE: Record<string, { date: string; status: "present" | "absent" | "late"; subject?: string }[]> = {
  "1": [
    { date: "2026-05-01", status: "present", subject: "Math" }, { date: "2026-05-02", status: "present", subject: "English" },
    { date: "2026-05-03", status: "late", subject: "Physics" }, { date: "2026-05-04", status: "present", subject: "Chemistry" },
    { date: "2026-05-05", status: "absent", subject: "Biology" }, { date: "2026-05-08", status: "present", subject: "Math" },
    { date: "2026-05-09", status: "present", subject: "English" }, { date: "2026-05-10", status: "present", subject: "Physics" },
    { date: "2026-05-11", status: "late", subject: "Chemistry" }, { date: "2026-05-12", status: "present", subject: "Biology" },
  ],
};

export default function ParentAttendancePage() {
  const { data: session } = useSession();
  const parentId = session?.user?.id || "1";
  const parent = parentsData.find((p) => p.id === parentId);
  const myChildren = studentsData.filter((s) => parent?.children.includes(s.name));
  const [selectedChildId, setSelectedChildId] = useState(myChildren[0]?.id || "");
  const child = myChildren.find((c) => c.id === selectedChildId);

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const records = MOCK_ATTENDANCE[selectedChildId] || [];
  const totalDays = records.length;
  const presentDays = records.filter((a) => a.status === "present").length;
  const absentDays = records.filter((a) => a.status === "absent").length;
  const lateDays = records.filter((a) => a.status === "late").length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const monthName = new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" });
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const getDayStatus = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return records.find((a) => a.date === dateStr);
  };

  if (!parent || myChildren.length === 0) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">No children linked</h1>
        <Link href="/dashboard/parent" className="mt-4 inline-block text-blue-600 hover:underline text-sm">← Back</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard/parent" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Child Selector + Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xl font-bold">
            {parent.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="mt-2 h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {myChildren.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — Class {c.class}</option>
              ))}
            </select>
          </div>
        </div>

        {child && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">{child.name}'s Attendance</span>
              <span className="text-lg font-bold text-green-700">{attendanceRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${attendanceRate}%` }} />
            </div>
          </div>
        )}
      </div>

      {child && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-2xl p-5 border border-green-100 text-center">
              <Check className="w-5 h-5 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">{presentDays}</p>
              <p className="text-xs text-green-600">Present</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-5 border border-red-100 text-center">
              <X className="w-5 h-5 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-700">{absentDays}</p>
              <p className="text-xs text-red-600">Absent</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 text-center">
              <Clock className="w-5 h-5 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-700">{lateDays}</p>
              <p className="text-xs text-amber-600">Late</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } else setCurrentMonth(currentMonth - 1); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
              <h3 className="text-lg font-semibold">{monthName} {currentYear}</h3>
              <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } else setCurrentMonth(currentMonth + 1); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (<div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }, (_, i) => (<div key={`e-${i}`} className="aspect-square" />))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                const record = getDayStatus(day);
                return (
                  <div key={day} className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm ${isToday ? "ring-2 ring-blue-500 font-bold" : ""} ${record ? (record.status === "present" ? "bg-green-100 text-green-700" : record.status === "absent" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700") : "text-gray-500 hover:bg-gray-50"}`}>
                    {day}
                    {record && <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${record.status === "present" ? "bg-green-500" : record.status === "absent" ? "bg-red-500" : "bg-amber-500"}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}