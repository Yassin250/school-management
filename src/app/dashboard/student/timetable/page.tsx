"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { studentsData } from "@/lib/mockData";
import { ArrowLeft, Calendar, Clock, School, BookOpen } from "lucide-react";
import Link from "next/link";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [
  { time: "08:00 - 08:45", label: "Period 1" },
  { time: "09:00 - 09:45", label: "Period 2" },
  { time: "10:00 - 10:45", label: "Period 3" },
  { time: "11:00 - 11:45", label: "Period 4" },
  { time: "12:00 - 12:45", label: "Lunch Break" },
  { time: "13:00 - 13:45", label: "Period 5" },
  { time: "14:00 - 14:45", label: "Period 6" },
  { time: "15:00 - 15:45", label: "Period 7" },
];

const MOCK_TIMETABLE: Record<string, Record<string, { subject: string; teacher: string; room: string } | null>> = {
  Monday: {
    "08:00 - 08:45": { subject: "Mathematics", teacher: "John Doe", room: "101" },
    "09:00 - 09:45": { subject: "English", teacher: "Allen Black", room: "102" },
    "10:00 - 10:45": { subject: "Physics", teacher: "Jane Doe", room: "Lab 1" },
    "11:00 - 11:45": { subject: "Chemistry", teacher: "Jane Doe", room: "Lab 2" },
    "12:00 - 12:45": null,
    "13:00 - 13:45": { subject: "Biology", teacher: "Mike Geller", room: "Lab 3" },
    "14:00 - 14:45": { subject: "History", teacher: "Jay French", room: "103" },
    "15:00 - 15:45": null,
  },
  Tuesday: {
    "08:00 - 08:45": { subject: "Physics", teacher: "Jane Doe", room: "Lab 1" },
    "09:00 - 09:45": { subject: "Mathematics", teacher: "John Doe", room: "101" },
    "10:00 - 10:45": { subject: "English", teacher: "Allen Black", room: "102" },
    "11:00 - 11:45": { subject: "Geography", teacher: "Jay French", room: "104" },
    "12:00 - 12:45": null,
    "13:00 - 13:45": { subject: "Computer Science", teacher: "Ophelia Castro", room: "Lab 4" },
    "14:00 - 14:45": { subject: "Chemistry", teacher: "Jane Doe", room: "Lab 2" },
    "15:00 - 15:45": null,
  },
  Wednesday: {
    "08:00 - 08:45": { subject: "Biology", teacher: "Mike Geller", room: "Lab 3" },
    "09:00 - 09:45": { subject: "Mathematics", teacher: "John Doe", room: "101" },
    "10:00 - 10:45": { subject: "English", teacher: "Allen Black", room: "102" },
    "11:00 - 11:45": { subject: "Physics", teacher: "Jane Doe", room: "Lab 1" },
    "12:00 - 12:45": null,
    "13:00 - 13:45": { subject: "History", teacher: "Jay French", room: "103" },
    "14:00 - 14:45": null,
    "15:00 - 15:45": { subject: "Computer Science", teacher: "Ophelia Castro", room: "Lab 4" },
  },
  Thursday: {
    "08:00 - 08:45": { subject: "English", teacher: "Allen Black", room: "102" },
    "09:00 - 09:45": { subject: "Chemistry", teacher: "Jane Doe", room: "Lab 2" },
    "10:00 - 10:45": { subject: "Mathematics", teacher: "John Doe", room: "101" },
    "11:00 - 11:45": { subject: "Biology", teacher: "Mike Geller", room: "Lab 3" },
    "12:00 - 12:45": null,
    "13:00 - 13:45": { subject: "Geography", teacher: "Jay French", room: "104" },
    "14:00 - 14:45": { subject: "Physics", teacher: "Jane Doe", room: "Lab 1" },
    "15:00 - 15:45": null,
  },
  Friday: {
    "08:00 - 08:45": { subject: "Mathematics", teacher: "John Doe", room: "101" },
    "09:00 - 09:45": { subject: "Computer Science", teacher: "Ophelia Castro", room: "Lab 4" },
    "10:00 - 10:45": { subject: "History", teacher: "Jay French", room: "103" },
    "11:00 - 11:45": { subject: "English", teacher: "Allen Black", room: "102" },
    "12:00 - 12:45": null,
    "13:00 - 13:45": { subject: "Biology", teacher: "Mike Geller", room: "Lab 3" },
    "14:00 - 14:45": null,
    "15:00 - 15:45": null,
  },
};

const getSubjectColor = (subject: string): string => {
  const colors: Record<string, string> = {
    Mathematics: "bg-blue-100 text-blue-700 border-blue-200",
    English: "bg-pink-100 text-pink-700 border-pink-200",
    Physics: "bg-amber-100 text-amber-700 border-amber-200",
    Chemistry: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Biology: "bg-green-100 text-green-700 border-green-200",
    History: "bg-orange-100 text-orange-700 border-orange-200",
    Geography: "bg-teal-100 text-teal-700 border-teal-200",
    "Computer Science": "bg-purple-100 text-purple-700 border-purple-200",
  };
  return colors[subject] || "bg-gray-100 text-gray-700 border-gray-200";
};

export default function StudentTimetablePage() {
  const { data: session } = useSession();
  const studentId = session?.user?.id || "1";
  const student = studentsData.find((s) => s.id === studentId) || studentsData[0];
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const today = new Date().getDay();
    return today >= 1 && today <= 5 ? DAYS[today - 1] : DAYS[0];
  });

  // Count total classes per week
  let totalClasses = 0;
  Object.values(MOCK_TIMETABLE).forEach((day) => {
    Object.values(day).forEach((slot) => {
      if (slot) totalClasses++;
    });
  });

  const todaySchedule = MOCK_TIMETABLE[selectedDay] || {};

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ========== BACK BUTTON ========== */}
      <Link href="/dashboard/student" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* ========== HEADER ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold ${
            student.sex === "MALE" ? "bg-blue-500" : "bg-pink-500"
          }`}>
            {student.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Timetable</h1>
            <p className="text-sm text-gray-500 mt-1">{student.name} • Class {student.class} • {totalClasses} classes/week</p>
          </div>
        </div>
      </div>

      {/* ========== STATS ========== */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900">{totalClasses}</p>
          <p className="text-xs text-gray-500">Classes/Week</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <BookOpen className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900">
            {new Set(Object.values(MOCK_TIMETABLE).flatMap((d) => Object.values(d).filter(Boolean).map((s) => s?.subject))).size}
          </p>
          <p className="text-xs text-gray-500">Subjects</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <School className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900">{student.class}</p>
          <p className="text-xs text-gray-500">Class</p>
        </div>
      </div>

      {/* ========== DAY SELECTOR ========== */}
      <div className="flex items-center gap-1 bg-white rounded-2xl p-1 border border-gray-100 shadow-sm">
        {DAYS.map((day) => {
          const isToday = day === DAYS[new Date().getDay() - 1];
          const isSelected = day === selectedDay;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isSelected
                  ? "bg-blue-600 text-white shadow-sm"
                  : isToday
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 3)}</span>
            </button>
          );
        })}
      </div>

      {/* ========== TIMETABLE ========== */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
          <div className="col-span-3">Time</div>
          <div className="col-span-9">Class Details</div>
        </div>

        <div className="divide-y divide-gray-50">
          {PERIODS.map((period) => {
            const entry = todaySchedule[period.time];
            const isLunch = period.label === "Lunch Break";

            return (
              <div
                key={period.time}
                className={`grid grid-cols-1 sm:grid-cols-12 gap-4 px-4 py-3 items-center ${
                  isLunch ? "bg-amber-50/50" : entry ? "hover:bg-gray-50" : ""
                }`}
              >
                {/* Time */}
                <div className="sm:col-span-3 flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400 hidden sm:block" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{period.label}</p>
                    <p className="text-xs text-gray-400">{period.time}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="sm:col-span-9">
                  {isLunch ? (
                    <div className="flex items-center gap-2 text-amber-700">
                      <span className="text-sm font-medium">🍽 Lunch Break</span>
                    </div>
                  ) : entry ? (
                    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl border ${getSubjectColor(entry.subject)}`}>
                      <div className="w-2 h-2 rounded-full bg-current opacity-50" />
                      <div>
                        <p className="text-sm font-semibold">{entry.subject}</p>
                        <p className="text-xs opacity-70">{entry.teacher} • Room {entry.room}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-300">Free Period</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========== WEEKLY OVERVIEW ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Overview</h3>
        <div className="grid grid-cols-5 gap-3">
          {DAYS.map((day) => {
            const daySchedule = MOCK_TIMETABLE[day] || {};
            const classCount = Object.values(daySchedule).filter(Boolean).length;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedDay === day
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <p className="text-xs font-semibold text-gray-900">{day.slice(0, 3)}</p>
                <p className="text-xl font-bold text-blue-600 mt-1">{classCount}</p>
                <p className="text-xs text-gray-400">classes</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}