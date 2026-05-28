"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { teachersData, examsData, studentsData } from "@/lib/mockData";
import { ArrowLeft, ClipboardCheck, Calendar, Clock, School, Search, BookOpen } from "lucide-react";
import Link from "next/link";

export default function TeacherExamsPage() {
  const { data: session } = useSession();
  const teacherId = session?.user?.id || "1";
  const teacher = teachersData.find((t) => t.id === teacherId);
  const myClassNames = teacher?.classes || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Get exams for teacher's classes
  const myExams = examsData.filter((exam) =>
    exam.classes.some((cls) => myClassNames.includes(cls))
  );

  // Filter
  const filteredExams = myExams.filter((exam) => {
    const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === "all" || exam.classes.includes(filterClass);
    const matchesStatus = filterStatus === "all" || exam.status === filterStatus;
    return matchesSearch && matchesClass && matchesStatus;
  });

  // Stats
  const upcomingCount = myExams.filter((e) => e.status === "Upcoming").length;
  const completedCount = myExams.filter((e) => e.status === "Completed").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Upcoming": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Ongoing": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Completed": return "bg-green-50 text-green-700 border-green-200";
      default: return "bg-gray-50 text-gray-700";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Mid-Term": return "bg-purple-50 text-purple-700";
      case "Final": return "bg-red-50 text-red-700";
      case "Unit Test": return "bg-blue-50 text-blue-700";
      case "Pre-Board": return "bg-amber-50 text-amber-700";
      default: return "bg-gray-50 text-gray-700";
    }
  };

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
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center">
            <ClipboardCheck className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
            <p className="text-sm text-gray-500 mt-1">
              {teacher.name} • {myExams.length} exams across {myClassNames.length} classes
            </p>
          </div>
        </div>
      </div>

      {/* ========== STATS ========== */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <ClipboardCheck className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{myExams.length}</p>
          <p className="text-xs text-gray-500">Total Exams</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 text-center">
          <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-700">{upcomingCount}</p>
          <p className="text-xs text-blue-600">Upcoming</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-5 border border-green-100 text-center">
          <ClipboardCheck className="w-5 h-5 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-700">{completedCount}</p>
          <p className="text-xs text-green-600">Completed</p>
        </div>
      </div>

      {/* ========== FILTERS ========== */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search exams..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
          className="h-10 px-3 rounded-xl border border-gray-200 text-sm">
          <option value="all">All Classes</option>
          {myClassNames.map((c) => (<option key={c} value={c}>Class {c}</option>))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 px-3 rounded-xl border border-gray-200 text-sm">
          <option value="all">All Status</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* ========== EXAM LIST ========== */}
      {filteredExams.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <ClipboardCheck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-gray-900">No Exams Found</h3>
          <p className="text-sm text-gray-500">No exams match your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${getTypeColor(exam.type)}`}>
                      {exam.type === "Mid-Term" ? "MT" : exam.type === "Final" ? "FN" : exam.type === "Unit Test" ? "UT" : "PB"}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{exam.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                        {exam.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> {exam.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(exam.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {exam.startDate !== exam.endDate && ` - ${new Date(exam.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {exam.subjects} subjects
                    </span>
                  </div>

                  {/* Classes */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {exam.classes.filter((cls) => myClassNames.includes(cls)).map((cls) => (
                      <span key={cls} className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        Class {cls}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-start">
                  {exam.status === "Upcoming" && (
                    <Link
                      href={`/dashboard/teacher/grades?class=${exam.classes[0]}&exam=${exam.id}`}
                      className="px-4 py-2 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700 transition-colors whitespace-nowrap"
                    >
                      Enter Marks
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}