// src/app/dashboard/parent/grades/ParentGradesClient.tsx
"use client";

import { useState } from "react";
import {
  ArrowLeft,
  TrendingUp,
  BookOpen,
  Award,
  FileText,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

type GradeDistribution = {
  A: number;
  B: number;
  C: number;
  D: number;
  F: number;
};

type SubjectAverage = {
  subject: string;
  avg: number;
  count: number;
};

type ResultItem = {
  id: number;
  type: "exam" | "assignment";
  title: string;
  subject: string;
  score: number;
  date: string;
  maxScore: number;
};

type ChildGrades = {
  id: string;
  name: string;
  className: string;
  gradeLevel: number;
  sex: string;
  examAvg: number;
  assignmentAvg: number;
  overallAvg: number;
  totalResults: number;
  gradeDistribution: GradeDistribution;
  subjectAverages: SubjectAverage[];
  recentResults: ResultItem[];
};

type Props = {
  parentName: string;
  children: ChildGrades[];
};

function getScoreColor(score: number) {
  if (score >= 90) return "text-green-600 bg-green-50";
  if (score >= 80) return "text-blue-600 bg-blue-50";
  if (score >= 70) return "text-amber-600 bg-amber-50";
  if (score >= 60) return "text-orange-600 bg-orange-50";
  return "text-red-600 bg-red-50";
}

function getGradeLetter(score: number) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function getDistColor(grade: string) {
  const colors: Record<string, string> = {
    A: "bg-green-500",
    B: "bg-blue-500",
    C: "bg-amber-500",
    D: "bg-orange-500",
    F: "bg-red-500",
  };
  return colors[grade] || "bg-gray-400";
}

export default function ParentGradesClient({ parentName, children }: Props) {
  const [selectedChildId, setSelectedChildId] = useState<string>(children[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<"overview" | "subjects" | "recent">("overview");

  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0];

  if (children.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto text-center">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900">No children enrolled</h1>
        <Link href="/dashboard/parent" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const distTotal = selectedChild
    ? Object.values(selectedChild.gradeDistribution).reduce((a, b) => a + b, 0)
    : 1;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/parent"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Grades & Results</h1>
            <p className="text-sm text-gray-500">View your children's academic performance</p>
          </div>
        </div>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all min-w-[200px] ${
                selectedChildId === child.id
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                child.sex === "MALE" ? "bg-blue-500" : "bg-pink-500"
              }`}>
                {child.name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">{child.name}</p>
                <p className="text-xs text-gray-500">Class {child.className}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Child Grades */}
      {selectedChild && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <Award className="w-5 h-5 text-purple-500 mx-auto mb-2" />
              <p className={`text-2xl font-bold ${getScoreColor(selectedChild.overallAvg).split(" ")[0]}`}>
                {selectedChild.overallAvg}%
              </p>
              <p className="text-xs text-gray-500">Overall Average</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <FileText className="w-5 h-5 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{selectedChild.examAvg}%</p>
              <p className="text-xs text-gray-500">Exam Average</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <BookOpen className="w-5 h-5 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-600">{selectedChild.assignmentAvg}%</p>
              <p className="text-xs text-gray-500">Assignment Avg</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <BarChart3 className="w-5 h-5 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{selectedChild.totalResults}</p>
              <p className="text-xs text-gray-500">Total Results</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
            {(["overview", "subjects", "recent"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition capitalize ${
                  activeTab === tab
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Overview Tab - Grade Distribution */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Grade Distribution */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Grade Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(selectedChild.gradeDistribution).map(([grade, count]) => (
                    <div key={grade} className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-700">
                        {grade}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getDistColor(grade)}`}
                          style={{ width: `${(count / distTotal) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-600 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Summary */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Latest Results
                </h3>
                <div className="space-y-2">
                  {selectedChild.recentResults.slice(0, 5).map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                          {result.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {result.subject} • {result.type}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                        getScoreColor(result.score)
                      }`}>
                        {result.score}% • {getGradeLetter(result.score)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Subjects Tab */}
          {activeTab === "subjects" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Subject Performance
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {selectedChild.subjectAverages.length > 0 ? (
                  selectedChild.subjectAverages.map((subj) => (
                    <div key={subj.subject} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{subj.subject}</p>
                        <p className="text-xs text-gray-400">{subj.count} assessment{subj.count !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              subj.avg >= 80 ? "bg-green-500" : subj.avg >= 60 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${subj.avg}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${getScoreColor(subj.avg).split(" ")[0]}`}>
                          {subj.avg}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400">No results yet</div>
                )}
              </div>
            </div>
          )}

          {/* Recent Tab */}
          {activeTab === "recent" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  All Results ({selectedChild.recentResults.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                {selectedChild.recentResults.length > 0 ? (
                  selectedChild.recentResults.map((result) => (
                    <div key={result.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        result.type === "exam" ? "bg-blue-100" : "bg-amber-100"
                      }`}>
                        {result.type === "exam" ? (
                          <FileText className="w-5 h-5 text-blue-600" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                        <p className="text-xs text-gray-400">
                          {result.subject} • <span className="capitalize">{result.type}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                          getScoreColor(result.score)
                        }`}>
                          {result.score}% • {getGradeLetter(result.score)}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">{result.date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No results available yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}