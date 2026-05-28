"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { studentsData, examsData } from "@/lib/mockData";
import { ArrowLeft, ClipboardCheck, Calendar, Clock, BookOpen, School, AlertCircle, Download } from "lucide-react";
import Link from "next/link";

type StudentExam = {
  id: string;
  name: string;
  type: string;
  subject: string;
  date: string;
  time: string;
  room: string;
  status: "Upcoming" | "Completed";
  score?: number;
  grade?: string;
};

const MOCK_STUDENT_EXAMS: StudentExam[] = [
  { id: "1", name: "Mid-Term Mathematics", type: "Mid-Term", subject: "Mathematics", date: "2026-05-08", time: "09:00 - 11:00", room: "101", status: "Completed", score: 85, grade: "B+" },
  { id: "2", name: "Mid-Term English", type: "Mid-Term", subject: "English", date: "2026-05-09", time: "09:00 - 11:00", room: "102", status: "Completed", score: 92, grade: "A-" },
  { id: "3", name: "Mid-Term Physics", type: "Mid-Term", subject: "Physics", date: "2026-05-10", time: "09:00 - 11:00", room: "Lab 1", status: "Completed", score: 78, grade: "B" },
  { id: "4", name: "Unit Test - Chemistry", type: "Unit Test", subject: "Chemistry", date: "2026-05-15", time: "10:00 - 11:00", room: "Lab 2", status: "Upcoming" },
  { id: "5", name: "Unit Test - Biology", type: "Unit Test", subject: "Biology", date: "2026-05-18", time: "10:00 - 11:00", room: "Lab 3", status: "Upcoming" },
  { id: "6", name: "Final Mathematics", type: "Final", subject: "Mathematics", date: "2026-07-15", time: "09:00 - 12:00", room: "101", status: "Upcoming" },
  { id: "7", name: "Final English", type: "Final", subject: "English", date: "2026-07-16", time: "09:00 - 12:00", room: "102", status: "Upcoming" },
  { id: "8", name: "Final Physics", type: "Final", subject: "Physics", date: "2026-07-17", time: "09:00 - 12:00", room: "Lab 1", status: "Upcoming" },
];

export default function StudentExamsPage() {
  const { data: session } = useSession();
  const studentId = session?.user?.id || "1";
  const student = studentsData.find((s) => s.id === studentId) || studentsData[0];

  const [filterStatus, setFilterStatus] = useState("all");

  const filteredExams = MOCK_STUDENT_EXAMS.filter((e) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "upcoming") return e.status === "Upcoming";
    if (filterStatus === "completed") return e.status === "Completed";
    return true;
  });

  const upcomingExams = MOCK_STUDENT_EXAMS.filter((e) => e.status === "Upcoming");
  const completedExams = MOCK_STUDENT_EXAMS.filter((e) => e.status === "Completed");
  const nextExam = upcomingExams[0];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Mid-Term": return "bg-purple-100 text-purple-700";
      case "Final": return "bg-red-100 text-red-700";
      case "Unit Test": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-amber-600";
    return "text-red-600";
  };

  const daysUntil = (dateStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(dateStr);
    exam.setHours(0, 0, 0, 0);
    return Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ========== BACK BUTTON ========== */}
      <Link href="/dashboard/student" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* ========== HEADER ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold ${
              student.sex === "MALE" ? "bg-blue-500" : "bg-pink-500"
            }`}>
              {student.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Exams</h1>
              <p className="text-sm text-gray-500 mt-1">{student.name} • Class {student.class}</p>
            </div>
          </div>

          <Link
            href="/dashboard/student/exams/card"
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Exam Card
          </Link>
        </div>
      </div>

      {/* ========== NEXT EXAM ALERT ========== */}
      {nextExam && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-5 border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-700">Next Exam</p>
              <p className="text-lg font-bold text-gray-900">{nextExam.name}</p>
              <p className="text-sm text-gray-500">
                {new Date(nextExam.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                {daysUntil(nextExam.date) <= 3 && (
                  <span className="ml-2 text-red-500 font-semibold">({daysUntil(nextExam.date)} days left!)</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========== STATS ========== */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <ClipboardCheck className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{MOCK_STUDENT_EXAMS.length}</p>
          <p className="text-xs text-gray-500">Total Exams</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 text-center">
          <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-700">{upcomingExams.length}</p>
          <p className="text-xs text-blue-600">Upcoming</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-5 border border-green-100 text-center">
          <ClipboardCheck className="w-5 h-5 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-700">{completedExams.length}</p>
          <p className="text-xs text-green-600">Completed</p>
        </div>
      </div>

      {/* ========== FILTERS ========== */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "All" },
          { key: "upcoming", label: "Upcoming" },
          { key: "completed", label: "Completed" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === f.key ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ========== EXAM LIST ========== */}
      {filteredExams.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <ClipboardCheck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-gray-900">No Exams</h3>
          <p className="text-sm text-gray-500">No exams match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${getTypeColor(exam.type)}`}>
                    {exam.type === "Mid-Term" ? "MT" : exam.type === "Final" ? "FN" : "UT"}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{exam.name}</h3>
                    <p className="text-xs text-gray-500">{exam.subject}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                        {new Date(exam.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exam.time}</span>
                      <span className="flex items-center gap-1"><School className="w-3 h-3" />Room {exam.room}</span>
                    </div>
                  </div>
                </div>

                {/* Score (if completed) */}
                {exam.status === "Completed" && exam.score !== undefined && (
                  <div className="text-right">
                    <p className={`text-xl font-bold ${getScoreColor(exam.score)}`}>{exam.score}%</p>
                    <p className="text-xs text-gray-400">{exam.grade}</p>
                  </div>
                )}

                {/* Days remaining (if upcoming) */}
                {exam.status === "Upcoming" && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{daysUntil(exam.date)} days</p>
                    <p className="text-xs text-gray-400">remaining</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}