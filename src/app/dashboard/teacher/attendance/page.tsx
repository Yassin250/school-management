"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { teachersData, classesData, studentsData } from "@/lib/mockData";
import { ArrowLeft, School, Users, Check, X, Clock, Search, Save, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type AttendanceStatus = "present" | "absent" | "late";

export default function TeacherAttendancePage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Get teacher info
  const teacherId = session?.user?.id || "1";
  const teacher = teachersData.find((t) => t.id === teacherId);
  const myClassNames = teacher?.classes || [];

  // State
  const [selectedClass, setSelectedClass] = useState<string>(myClassNames[0] || "");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [viewMode, setViewMode] = useState<"mark" | "view">("mark");

  // Get students for selected class
  const classStudents = studentsData.filter((s) => s.class === selectedClass);

  // Filter by search
  const filteredStudents = classStudents.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Initialize attendance for students
  const initAttendance = () => {
    const initial: Record<string, AttendanceStatus> = {};
    classStudents.forEach((s) => {
      initial[s.id] = attendance[s.id] || "present";
    });
    setAttendance(initial);
    setIsSaved(false);
  };

  // Handle class change
  const handleClassChange = (className: string) => {
    setSelectedClass(className);
    initAttendance();
  };

  // Toggle attendance status
  const toggleStatus = (studentId: string) => {
    setAttendance((prev) => {
      const current = prev[studentId] || "present";
      const next: Record<AttendanceStatus, AttendanceStatus> = {
        present: "absent",
        absent: "late",
        late: "present",
      };
      return { ...prev, [studentId]: next[current] };
    });
    setIsSaved(false);
  };

  // Set all to a status
  const setAllStatus = (status: AttendanceStatus) => {
    const newAttendance: Record<string, AttendanceStatus> = {};
    classStudents.forEach((s) => {
      newAttendance[s.id] = status;
    });
    setAttendance(newAttendance);
    setIsSaved(false);
  };

  // Save attendance
  const handleSave = () => {
    // TODO: Save to API/Prisma
    console.log("Saving attendance:", {
      class: selectedClass,
      date: selectedDate,
      attendance,
      markedBy: teacher?.name,
    });
    setIsSaved(true);
    toast.success("Attendance saved successfully!");
  };

  // Get status color
  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-700 border-green-300";
      case "absent": return "bg-red-100 text-red-700 border-red-300";
      case "late": return "bg-amber-100 text-amber-700 border-amber-300";
    }
  };

  // Count stats
  const presentCount = Object.values(attendance).filter((s) => s === "present").length;
  const absentCount = Object.values(attendance).filter((s) => s === "absent").length;
  const lateCount = Object.values(attendance).filter((s) => s === "late").length;

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
              <p className="text-sm text-gray-500 mt-1">{teacher.name}</p>
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
      {viewMode === "mark" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Class Selector */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {myClassNames.map((cls) => (
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
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* ========== STATS BAR ========== */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-lg font-bold">{classStudents.length}</p>
              <p className="text-xs text-gray-500">Total</p>
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
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 text-center">
              <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-amber-700">{lateCount}</p>
              <p className="text-xs text-amber-600">Late</p>
            </div>
          </div>

          {/* ========== BULK ACTIONS ========== */}
          <div className="flex items-center gap-2">
            <button onClick={() => setAllStatus("present")} className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
              All Present
            </button>
            <button onClick={() => setAllStatus("absent")} className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100">
              All Absent
            </button>
            <button onClick={() => setAllStatus("late")} className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100">
              All Late
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
                const status = attendance[student.id] || "present";
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        student.sex === "MALE" ? "bg-blue-500" : "bg-pink-500"
                      }`}>
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-400">ID: {student.studentId}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleStatus(student.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all min-w-[100px] ${getStatusColor(status)}`}
                    >
                      {status === "present" && <Check className="w-4 h-4 inline mr-1" />}
                      {status === "absent" && <X className="w-4 h-4 inline mr-1" />}
                      {status === "late" && <Clock className="w-4 h-4 inline mr-1" />}
                      {status.charAt(0).toUpperCase() + status.slice(1)}
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
              disabled={classStudents.length === 0}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                isSaved
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSaved ? (
                <>✓ Saved</>
              ) : (
                <><Save className="w-4 h-4" /> Save Attendance</>
              )}
            </button>
          </div>
        </>
      )}

      {/* ========== VIEW MODE ========== */}
      {viewMode === "view" && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance History</h3>
          <p className="text-sm text-gray-500">Select a class and date to view attendance records.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm"
              >
                {myClassNames.map((cls) => (
                  <option key={cls} value={cls}>Class {cls}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm"
              />
            </div>
          </div>

          {/* Mock history table */}
          <div className="mt-6 border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {classStudents.slice(0, 5).map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 px-4 font-medium">{s.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-700">Present</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}