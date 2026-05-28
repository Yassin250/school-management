"use client";

import { useSession } from "next-auth/react";
import { studentsData } from "@/lib/mockData";
import { ArrowLeft, TrendingUp, Star, BookOpen, Award } from "lucide-react";
import Link from "next/link";

type Grade = {
  subject: string;
  score: number;
  grade: string;
  teacher: string;
  exam: string;
};

export default function StudentGradesPage() {
  const { data: session } = useSession();
  const studentId = session?.user?.id || "1";
  const student = studentsData.find((s) => s.id === studentId) || studentsData[0];

  // Mock grades for this student
  const grades: Grade[] = [
    { subject: "Mathematics", score: 85, grade: "B+", teacher: "John Doe", exam: "Mid-Term" },
    { subject: "English", score: 92, grade: "A-", teacher: "Allen Black", exam: "Mid-Term" },
    { subject: "Physics", score: 78, grade: "B", teacher: "Jane Doe", exam: "Mid-Term" },
    { subject: "Chemistry", score: 88, grade: "B+", teacher: "Jane Doe", exam: "Unit Test" },
    { subject: "Biology", score: 95, grade: "A", teacher: "Mike Geller", exam: "Mid-Term" },
    { subject: "History", score: 72, grade: "C+", teacher: "Jay French", exam: "Unit Test" },
    { subject: "Geography", score: 80, grade: "B", teacher: "Jay French", exam: "Mid-Term" },
    { subject: "Computer Science", score: 91, grade: "A-", teacher: "Ophelia Castro", exam: "Mid-Term" },
  ];

  // Calculate stats
  const avgScore = Math.round(grades.reduce((sum, g) => sum + g.score, 0) / grades.length);
  const highestScore = Math.max(...grades.map((g) => g.score));
  const lowestScore = Math.min(...grades.map((g) => g.score));
  const aGrades = grades.filter((g) => g.score >= 90).length;

  const getGradeColor = (score: number): string => {
    if (score >= 90) return "bg-green-100 text-green-700";
    if (score >= 80) return "bg-blue-100 text-blue-700";
    if (score >= 70) return "bg-amber-100 text-amber-700";
    if (score >= 60) return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  };

  const getProgressColor = (score: number): string => {
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-blue-500";
    if (score >= 70) return "bg-amber-500";
    if (score >= 60) return "bg-orange-500";
    return "bg-red-500";
  };

  const getLetterGrade = (score: number): string => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
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
            <h1 className="text-2xl font-bold text-gray-900">My Grades</h1>
            <p className="text-sm text-gray-500 mt-1">{student.name} • Class {student.class} • Grade {student.grade}</p>
          </div>
        </div>

        {/* Overall Grade Badge */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-green-50 border border-blue-100">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm">
            <span className="text-2xl font-bold text-blue-600">{getLetterGrade(avgScore)}</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">Overall Average</p>
            <p className="text-sm text-gray-500">{avgScore}% across {grades.length} subjects</p>
          </div>
        </div>
      </div>

      {/* ========== STATS ========== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <BookOpen className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
          <p className="text-xs text-gray-500">Subjects</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{avgScore}%</p>
          <p className="text-xs text-gray-500">Average</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Star className="w-5 h-5 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{highestScore}%</p>
          <p className="text-xs text-gray-500">Highest</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Award className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{aGrades}</p>
          <p className="text-xs text-gray-500">A Grades</p>
        </div>
      </div>

      {/* ========== GRADE LIST ========== */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Subject Grades</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {grades.map((grade) => (
            <div key={grade.subject} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{grade.subject}</p>
                  <p className="text-xs text-gray-400">{grade.teacher} • {grade.exam}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">{grade.score}%</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getGradeColor(grade.score)}`}>
                    {grade.grade}
                  </span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(grade.score)}`}
                  style={{ width: `${grade.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========== GRADE DISTRIBUTION ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
        <div className="space-y-3">
          {[
            { label: "A (90-100)", count: grades.filter((g) => g.score >= 90).length, color: "bg-green-500" },
            { label: "B (80-89)", count: grades.filter((g) => g.score >= 80 && g.score < 90).length, color: "bg-blue-500" },
            { label: "C (70-79)", count: grades.filter((g) => g.score >= 70 && g.score < 80).length, color: "bg-amber-500" },
            { label: "D (60-69)", count: grades.filter((g) => g.score >= 60 && g.score < 70).length, color: "bg-orange-500" },
            { label: "F (0-59)", count: grades.filter((g) => g.score < 60).length, color: "bg-red-500" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-24">{item.label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${item.color} transition-all`}
                  style={{ width: `${(item.count / grades.length) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 w-6 text-right">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}