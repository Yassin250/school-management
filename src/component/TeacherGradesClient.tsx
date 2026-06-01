// src/component/TeacherGradesClient.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, School, Save, Search, TrendingUp, Star, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { saveGrades } from "@/lib/actions/grade";

type StudentData = {
  id: string;
  name: string;
  surname: string;
  username: string;
  sex: "MALE" | "FEMALE";
};

type ItemOption = {
  id: number;
  title: string;
};

type Props = {
  teacherName: string;
  classes: string[];
  subjects: string[];
  selectedClass: string;
  selectedSubject: string;
  gradingType: "exam" | "assignment";
  selectedItemId: number | null;
  items: ItemOption[];
  students: StudentData[];
  existingGrades: Record<string, number>; // studentId -> score
};

export default function TeacherGradesClient({
  teacherName,
  classes,
  subjects,
  selectedClass,
  selectedSubject,
  gradingType,
  selectedItemId,
  items,
  students,
  existingGrades,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Local state for grades
  const [grades, setGrades] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    students.forEach((s) => {
      initial[s.id] = existingGrades[s.id] !== undefined ? existingGrades[s.id] : 0;
    });
    return initial;
  });

  useEffect(() => {
    const initial: Record<string, number> = {};
    students.forEach((s) => {
      initial[s.id] = existingGrades[s.id] !== undefined ? existingGrades[s.id] : 0;
    });
    setGrades(initial);
  }, [students, existingGrades, selectedItemId, selectedClass, selectedSubject, gradingType]);

  const handleUrlChange = (updates: {
    class?: string;
    subject?: string;
    type?: "exam" | "assignment";
    itemId?: string;
  }) => {
    const params = new URLSearchParams();
    params.set("class", updates.class ?? selectedClass);
    params.set("subject", updates.subject ?? selectedSubject);
    params.set("type", updates.type ?? gradingType);
    if (updates.itemId !== undefined) {
      if (updates.itemId) params.set("itemId", updates.itemId);
    } else if (selectedItemId) {
      params.set("itemId", selectedItemId.toString());
    }
    router.push(`/dashboard/teacher/grades?${params.toString()}`);
    setIsSaved(false);
  };

  const updateScore = (studentId: string, value: string) => {
    const score = parseInt(value) || 0;
    const clamped = Math.max(0, Math.min(100, score));
    setGrades((prev) => ({
      ...prev,
      [studentId]: clamped,
    }));
    setIsSaved(false);
  };

  const setAllScores = (score: number) => {
    const newGrades: Record<string, number> = {};
    students.forEach((s) => {
      newGrades[s.id] = score;
    });
    setGrades(newGrades);
    setIsSaved(false);
  };

  const handleSave = async () => {
    if (!selectedItemId) {
      toast.error("Please select an Exam or Assignment to grade!");
      return;
    }

    const records = Object.entries(grades).map(([studentId, score]) => ({
      studentId,
      score,
    }));

    startTransition(async () => {
      const res = await saveGrades({
        examId: gradingType === "exam" ? selectedItemId : undefined,
        assignmentId: gradingType === "assignment" ? selectedItemId : undefined,
        records,
      });

      if (res.success) {
        setIsSaved(true);
        toast.success("Grades saved successfully!");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save grades");
      }
    });
  };

  const getLetterGrade = (score: number): string => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  const getGradeColor = (score: number): string => {
    if (score >= 90) return "bg-green-100 text-green-700";
    if (score >= 80) return "bg-blue-100 text-blue-700";
    if (score >= 70) return "bg-amber-100 text-amber-700";
    if (score >= 60) return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  };

  const filteredStudents = students.filter((s) =>
    `${s.name} ${s.surname}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const gradedStudentsCount = Object.values(grades).filter((s) => s > 0).length;
  const totalScoreSum = Object.values(grades).reduce((sum, s) => sum + s, 0);
  const avgScore = students.length > 0 ? Math.round(totalScoreSum / students.length) : 0;

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
            <p className="text-sm text-gray-500 mt-1">{teacherName}</p>
          </div>
        </div>
      </div>

      {/* ========== CONTROLS ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Class Selector */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => handleUrlChange({ class: e.target.value, itemId: "" })}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {classes.map((cls) => (
              <option key={cls} value={cls}>Class {cls}</option>
            ))}
          </select>
        </div>

        {/* Subject Selector */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => handleUrlChange({ subject: e.target.value, itemId: "" })}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {subjects.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        {/* Grading Type Selector */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Grading Type</label>
          <select
            value={gradingType}
            onChange={(e) => handleUrlChange({ type: e.target.value as "exam" | "assignment", itemId: "" })}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="exam">Exam</option>
            <option value="assignment">Assignment</option>
          </select>
        </div>

        {/* Specific Item Selector */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
            Select {gradingType === "exam" ? "Exam" : "Assignment"}
          </label>
          <select
            value={selectedItemId || ""}
            onChange={(e) => handleUrlChange({ itemId: e.target.value })}
            disabled={items.length === 0}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {items.length === 0 ? (
              <option value="">No items found</option>
            ) : (
              <>
                <option value="">Choose item...</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
      </div>

      {!selectedItemId ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-center text-sm font-medium">
          💡 Please select a class, subject, and a specific Exam or Assignment above to view/enter grades.
        </div>
      ) : (
        <>
          {/* ========== STATS BAR ========== */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-lg font-bold">{students.length}</p>
              <p className="text-xs text-gray-500">Students</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-center">
              <Star className="w-4 h-4 text-blue-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-700">{gradedStudentsCount}</p>
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

          {/* ========== STUDENT GRADE LIST ========== */}
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
                const score = grades[student.id] || 0;
                const letter = getLetterGrade(score);

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
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{student.name} {student.surname}</p>
                        <p className="text-xs text-gray-400">Username: {student.username}</p>
                      </div>
                    </div>

                    {/* Score Input */}
                    <div className="sm:col-span-3 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={score || ""}
                        onChange={(e) => updateScore(student.id, e.target.value)}
                        placeholder="0-100"
                        className="w-20 h-9 px-3 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-400">/100</span>
                    </div>

                    {/* Letter Grade */}
                    <div className="sm:col-span-2">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getGradeColor(score)}`}>
                        {letter}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="sm:col-span-2">
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
                    </div>
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
              {isSaved ? "✓ Saved" : isPending ? "Saving..." : "Save Grades"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
