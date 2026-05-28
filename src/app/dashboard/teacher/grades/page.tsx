"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { teachersData, studentsData } from "@/lib/mockData";
import { ArrowLeft, School, Save, Search, TrendingUp, Star } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type GradeEntry = {
  score: number;
  grade: string;
};

export default function TeacherGradesPage() {
  const { data: session } = useSession();

  const teacherId = session?.user?.id || "1";
  const teacher = teachersData.find((t) => t.id === teacherId);
  const myClassNames = teacher?.classes || [];
  const mySubjects = teacher?.subjects || [];

  const [selectedClass, setSelectedClass] = useState<string>(myClassNames[0] || "");
  const [selectedSubject, setSelectedSubject] = useState<string>(mySubjects[0] || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [grades, setGrades] = useState<Record<string, GradeEntry>>({});
  const [isSaved, setIsSaved] = useState(false);

  // Students in selected class
  const classStudents = studentsData.filter((s) => s.class === selectedClass);

  // Filter by search
  const filteredStudents = classStudents.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get letter grade from score
  const getLetterGrade = (score: number): string => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  // Get grade color
  const getGradeColor = (score: number): string => {
    if (score >= 90) return "bg-green-100 text-green-700";
    if (score >= 80) return "bg-blue-100 text-blue-700";
    if (score >= 70) return "bg-amber-100 text-amber-700";
    if (score >= 60) return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  };

  // Update score for a student
  const updateScore = (studentId: string, value: string) => {
    const score = parseInt(value) || 0;
    const clamped = Math.max(0, Math.min(100, score));
    setGrades((prev) => ({
      ...prev,
      [studentId]: { score: clamped, grade: getLetterGrade(clamped) },
    }));
    setIsSaved(false);
  };

  // Set all scores
  const setAllScores = (score: number) => {
    const newGrades: Record<string, GradeEntry> = {};
    classStudents.forEach((s) => {
      newGrades[s.id] = { score, grade: getLetterGrade(score) };
    });
    setGrades(newGrades);
    setIsSaved(false);
  };

  // Save grades
  const handleSave = () => {
    console.log("Saving grades:", {
      class: selectedClass,
      subject: selectedSubject,
      grades,
      teacher: teacher?.name,
    });
    setIsSaved(true);
    toast.success("Grades saved successfully!");
  };

  // Stats
  const gradedStudents = Object.keys(grades).length;
  const avgScore =
    gradedStudents > 0
      ? Math.round(
          Object.values(grades).reduce((sum, g) => sum + g.score, 0) / gradedStudents
        )
      : 0;

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
          <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center">
            <Star className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Grades</h1>
            <p className="text-sm text-gray-500 mt-1">{teacher.name}</p>
          </div>
        </div>
      </div>

      {/* ========== CONTROLS ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setGrades({});
              setIsSaved(false);
            }}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {myClassNames.map((cls) => (
              <option key={cls} value={cls}>Class {cls}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setGrades({});
              setIsSaved(false);
            }}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {mySubjects.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ========== STATS BAR ========== */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <School className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <p className="text-lg font-bold">{classStudents.length}</p>
          <p className="text-xs text-gray-500">Students</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-center">
          <Star className="w-4 h-4 text-blue-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-blue-700">{gradedStudents}</p>
          <p className="text-xs text-blue-600">Graded</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 border border-green-100 text-center">
          <TrendingUp className="w-4 h-4 text-green-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-green-700">{avgScore}%</p>
          <p className="text-xs text-green-600">Avg Score</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100 text-center">
          <Star className="w-4 h-4 text-purple-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-purple-700">{avgScore > 0 ? getLetterGrade(avgScore) : "-"}</p>
          <p className="text-xs text-purple-600">Avg Grade</p>
        </div>
      </div>

      {/* ========== BULK ACTIONS ========== */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Set all:</span>
        {[100, 90, 80, 70, 60, 50].map((score) => (
          <button
            key={score}
            onClick={() => setAllScores(score)}
            className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"
          >
            {score}%
          </button>
        ))}
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

      {/* ========== EMPTY STATE ========== */}
      {classStudents.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <School className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-gray-900">No Students</h3>
          <p className="text-sm text-gray-500">No students in this class.</p>
        </div>
      )}

      {/* ========== STUDENT GRADE LIST ========== */}
      {classStudents.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
            <div className="col-span-5">Student</div>
            <div className="col-span-3">Score</div>
            <div className="col-span-2">Grade</div>
            <div className="col-span-2">Progress</div>
          </div>

          <div className="divide-y divide-gray-50">
            {filteredStudents.map((student) => {
              const entry = grades[student.id];
              const score = entry?.score || 0;
              const letter = entry?.grade || "-";

              return (
                <div
                  key={student.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-gray-50 transition-colors"
                >
                  {/* Student Info */}
                  <div className="sm:col-span-5 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      student.sex === "MALE" ? "bg-blue-500" : "bg-pink-500"
                    }`}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-400">ID: {student.studentId}</p>
                    </div>
                  </div>

                  {/* Score Input */}
                  <div className="sm:col-span-3 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={entry?.score || ""}
                      onChange={(e) => updateScore(student.id, e.target.value)}
                      placeholder="0-100"
                      className="w-20 h-9 px-3 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-400">/100</span>
                  </div>

                  {/* Letter Grade */}
                  <div className="sm:col-span-2">
                    {entry && (
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getGradeColor(score)}`}>
                        {letter}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="sm:col-span-2">
                    {entry && (
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            score >= 90 ? "bg-green-500" :
                            score >= 80 ? "bg-blue-500" :
                            score >= 70 ? "bg-amber-500" :
                            score >= 60 ? "bg-orange-500" : "bg-red-500"
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========== SAVE BUTTON ========== */}
      {classStudents.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              isSaved
                ? "bg-green-100 text-green-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isSaved ? (
              <>✓ Saved</>
            ) : (
              <><Save className="w-4 h-4" /> Save Grades</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}