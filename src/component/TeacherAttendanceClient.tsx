// src/component/TeacherAttendanceClient.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Search, Check, X, Users, Eye, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { saveAttendance } from "@/lib/actions/attendance";

type StudentData = {
  id: string;
  name: string;
  surname: string;
  username: string;
  sex: "MALE" | "FEMALE";
};

type LessonData = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
};

type Props = {
  teacherName: string;
  classes: string[];
  selectedClass: string;
  selectedDate: string;
  lessons: LessonData[];
  selectedLessonId: number | null;
  students: StudentData[];
  existingAttendance: Record<string, boolean>; // studentId -> present
};

export default function TeacherAttendanceClient({
  teacherName,
  classes,
  selectedClass,
  selectedDate,
  lessons,
  selectedLessonId,
  students,
  existingAttendance,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"mark" | "view">("mark");

  // Local attendance state
  const [attendance, setAttendance] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    students.forEach((s) => {
      initial[s.id] = existingAttendance[s.id] !== undefined ? existingAttendance[s.id] : true;
    });
    return initial;
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleUrlChange = (newClass: string, newDate: string, newLessonId?: string) => {
    const params = new URLSearchParams();
    params.set("class", newClass);
    params.set("date", newDate);
    if (newLessonId) {
      params.set("lessonId", newLessonId);
    }
    router.push(`/dashboard/teacher/attendance?${params.toString()}`);
    setIsSaved(false);
  };

  const toggleStatus = (studentId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
    setIsSaved(false);
  };

  const setAllStatus = (present: boolean) => {
    const next: Record<string, boolean> = {};
    students.forEach((s) => {
      next[s.id] = present;
    });
    setAttendance(next);
    setIsSaved(false);
  };

  const handleSave = async () => {
    if (!selectedLessonId) {
      toast.error("No lesson selected to mark attendance!");
      return;
    }

    const records = Object.entries(attendance).map(([studentId, present]) => ({
      studentId,
      present,
    }));

    startTransition(async () => {
      const res = await saveAttendance({
        lessonId: selectedLessonId,
        date: selectedDate,
        records,
      });

      if (res.success) {
        setIsSaved(true);
        toast.success("Attendance saved successfully!");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save attendance");
      }
    });
  };

  const filteredStudents = students.filter((s) =>
    `${s.name} ${s.surname}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ========== BACK BUTTON ========== */}
      <Link href="/dashboard/teacher" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* ========== HEADER ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
              <Clock className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
              <p className="text-sm text-gray-500 mt-1">{teacherName}</p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode("mark")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === "mark" ? "bg-white shadow text-gray-900" : "text-gray-500"
              }`}
            >
              <Check className="w-4 h-4 inline mr-1" /> Mark
            </button>
            <button
              onClick={() => setViewMode("view")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === "view" ? "bg-white shadow text-gray-900" : "text-gray-500"
              }`}
            >
              <Eye className="w-4 h-4 inline mr-1" /> View
            </button>
          </div>
        </div>
      </div>

      {/* ========== CONTROLS ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Class Selector */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => handleUrlChange(e.target.value, selectedDate)}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {classes.map((cls) => (
              <option key={cls} value={cls}>Class {cls}</option>
            ))}
          </select>
        </div>

        {/* Date Picker */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleUrlChange(selectedClass, e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Lesson Selector */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Lesson</label>
          <select
            value={selectedLessonId || ""}
            onChange={(e) => handleUrlChange(selectedClass, selectedDate, e.target.value)}
            disabled={lessons.length === 0}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {lessons.length === 0 ? (
              <option value="">No Lessons Scheduled</option>
            ) : (
              lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.name} ({lesson.startTime} - {lesson.endTime})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-center text-sm font-medium">
          ⚠️ No lessons scheduled for Class {selectedClass} on this day of the week.
        </div>
      ) : viewMode === "mark" ? (
        <>
          {/* ========== STATS BAR ========== */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-lg font-bold">{students.length}</p>
              <p className="text-xs text-gray-500">Total Students</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-4 border border-green-100 text-center">
              <Check className="w-4 h-4 text-green-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-700">{presentCount}</p>
              <p className="text-xs text-green-600">Present</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 border border-red-100 text-center">
              <X className="w-4 h-4 text-red-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-red-700">{absentCount}</p>
              <p className="text-xs text-red-600">Absent</p>
            </div>
          </div>

          {/* ========== BULK ACTIONS ========== */}
          <div className="flex items-center gap-2">
            <button onClick={() => setAllStatus(true)} className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
              All Present
            </button>
            <button onClick={() => setAllStatus(false)} className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100">
              All Absent
            </button>
          </div>

          {/* ========== SEARCH ========== */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ========== STUDENT LIST ========== */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {filteredStudents.map((student) => {
                const present = attendance[student.id];
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        student.sex === "MALE" ? "bg-blue-500" : "bg-pink-500"
                      }`}>
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{student.name} {student.surname}</p>
                        <p className="text-xs text-gray-400">Username: {student.username}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleStatus(student.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all min-w-[100px] ${
                        present
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      }`}
                    >
                      {present ? (
                        <>✓ Present</>
                      ) : (
                        <>✗ Absent</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========== SAVE BUTTON ========== */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isPending || students.length === 0}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                isSaved
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              }`}
            >
              {isSaved ? "✓ Saved" : isPending ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </>
      ) : (
        /* ========== VIEW HISTORY ========== */
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance History</h3>
          <p className="text-sm text-gray-500 mb-6">
            Showing records for Class {selectedClass} and selected lesson on {selectedDate}.
          </p>

          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student) => {
                  const isPresent = existingAttendance[student.id];
                  const hasRecord = existingAttendance[student.id] !== undefined;

                  return (
                    <tr key={student.id}>
                      <td className="py-3 px-4 font-medium">{student.name} {student.surname}</td>
                      <td className="py-3 px-4">
                        {!hasRecord ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500">No Record</span>
                        ) : isPresent ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-700">Present</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-50 text-red-700">Absent</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
