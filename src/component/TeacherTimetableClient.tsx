// src/component/TeacherTimetableClient.tsx
"use client";

import { useState } from "react";
import { ArrowLeft, Calendar, Clock, School, ChevronLeft } from "lucide-react";
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

type TimetableEntry = {
  subject: string;
  class: string;
  room: string;
} | null;

type DayTimetable = Record<string, TimetableEntry>;
type TimetableData = Record<string, DayTimetable>;

type Props = {
  teacherName: string;
  totalClasses: number;
  classesCount: number;
  subjectsCount: number;
  timetable: TimetableData;
};

const getSubjectColor = (subject: string): string => {
  const colors: Record<string, string> = {
    Math: "bg-blue-100 text-blue-700 border-blue-200",
    Mathematics: "bg-blue-100 text-blue-700 border-blue-200",
    Geometry: "bg-purple-100 text-purple-700 border-purple-200",
    Physics: "bg-amber-100 text-amber-700 border-amber-200",
    Chemistry: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Biology: "bg-green-100 text-green-700 border-green-200",
    English: "bg-pink-100 text-pink-700 border-pink-200",
    History: "bg-orange-100 text-orange-700 border-orange-200",
    Music: "bg-indigo-100 text-indigo-700 border-indigo-200",
  };
  return colors[subject] || "bg-gray-100 text-gray-700 border-gray-200";
};

export default function TeacherTimetableClient({
  teacherName,
  totalClasses,
  classesCount,
  subjectsCount,
  timetable,
}: Props) {
  const [selectedDay, setSelectedDay] = useState<string>(
    DAYS[new Date().getDay() - 1] || DAYS[0]
  );

  const todaySchedule = timetable[selectedDay] || {};

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ========== BACK BUTTON ========== */}
      <Link href="/dashboard/teacher" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* ========== HEADER ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-sky-50 flex items-center justify-center">
              <Calendar className="w-7 h-7 text-sky-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Timetable</h1>
              <p className="text-sm text-gray-500 mt-1">{teacherName} • {totalClasses} classes per week</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== STATS ========== */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Calendar className="w-5 h-5 text-sky-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalClasses}</p>
          <p className="text-xs text-gray-500">Classes/Week</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <School className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{classesCount}</p>
          <p className="text-xs text-gray-500">Classes Taught</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Clock className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{subjectsCount}</p>
          <p className="text-xs text-gray-500">Subjects</p>
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
                  ? "bg-sky-600 text-white shadow-sm"
                  : isToday
                  ? "text-sky-600 bg-sky-50"
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
        {/* Header */}
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
                        <p className="text-xs opacity-70">Class {entry.class} • Room {entry.room}</p>
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

      {/* ========== WEEKLY OVERVIEW (MOBILE-FRIENDLY CARDS) ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {DAYS.map((day) => {
            const daySchedule = timetable[day] || {};
            const classCount = Object.values(daySchedule).filter(Boolean).length;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedDay === day
                    ? "border-sky-300 bg-sky-50"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">{day.slice(0, 3)}</p>
                <p className="text-2xl font-bold text-sky-600 mt-1">{classCount}</p>
                <p className="text-xs text-gray-400">classes</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
