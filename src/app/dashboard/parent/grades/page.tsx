"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { parentsData, studentsData } from "@/lib/mockData";
import { ArrowLeft, TrendingUp, Star, BookOpen, Award } from "lucide-react";
import Link from "next/link";

const MOCK_GRADES: Record<string, { subject: string; score: number; grade: string; teacher: string; exam: string }[]> = {
  "1": [
    { subject: "Mathematics", score: 85, grade: "B+", teacher: "John Doe", exam: "Mid-Term" },
    { subject: "English", score: 92, grade: "A-", teacher: "Allen Black", exam: "Mid-Term" },
    { subject: "Physics", score: 78, grade: "B", teacher: "Jane Doe", exam: "Mid-Term" },
    { subject: "Chemistry", score: 88, grade: "B+", teacher: "Jane Doe", exam: "Unit Test" },
    { subject: "Biology", score: 95, grade: "A", teacher: "Mike Geller", exam: "Mid-Term" },
    { subject: "History", score: 72, grade: "C+", teacher: "Jay French", exam: "Unit Test" },
    { subject: "Geography", score: 80, grade: "B", teacher: "Jay French", exam: "Mid-Term" },
    { subject: "Computer Science", score: 91, grade: "A-", teacher: "Ophelia Castro", exam: "Mid-Term" },
  ],
};

export default function ParentGradesPage() {
  const { data: session } = useSession();
  const parentId = session?.user?.id || "1";
  const parent = parentsData.find((p) => p.id === parentId);
  const myChildren = studentsData.filter((s) => parent?.children.includes(s.name));
  const [selectedChildId, setSelectedChildId] = useState(myChildren[0]?.id || "");
  const child = myChildren.find((c) => c.id === selectedChildId);

  const grades = MOCK_GRADES[selectedChildId] || [];
  const avgScore = grades.length > 0 ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / grades.length) : 0;
  const highest = grades.length > 0 ? Math.max(...grades.map((g) => g.score)) : 0;

  const getGradeColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-700";
    if (score >= 80) return "bg-blue-100 text-blue-700";
    if (score >= 70) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  if (!parent || myChildren.length === 0) {
    return <div className="p-6 text-center"><h1 className="text-xl font-semibold">No children linked</h1></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard/parent" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xl font-bold">
            {parent.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Grades</h1>
            <select value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)}
              className="mt-2 h-10 px-3 rounded-lg border border-gray-200 text-sm">
              {myChildren.map((c) => (<option key={c.id} value={c.id}>{c.name} — Class {c.class}</option>))}
            </select>
          </div>
        </div>

        {child && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm">
                <span className="text-2xl font-bold text-blue-600">{avgScore > 0 ? (avgScore >= 90 ? "A" : avgScore >= 80 ? "B" : avgScore >= 70 ? "C" : "D") : "-"}</span>
              </div>
              <div>
                <p className="text-sm font-semibold">{child.name}'s Average</p>
                <p className="text-xs text-gray-500">{avgScore}% across {grades.length} subjects</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {child && grades.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border text-center"><BookOpen className="w-5 h-5 text-blue-500 mx-auto mb-2" /><p className="text-xl font-bold">{grades.length}</p><p className="text-xs text-gray-500">Subjects</p></div>
            <div className="bg-white rounded-2xl p-4 border text-center"><TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-2" /><p className="text-xl font-bold">{avgScore}%</p><p className="text-xs text-gray-500">Average</p></div>
            <div className="bg-white rounded-2xl p-4 border text-center"><Award className="w-5 h-5 text-purple-500 mx-auto mb-2" /><p className="text-xl font-bold">{highest}%</p><p className="text-xs text-gray-500">Highest</p></div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50"><h3 className="text-sm font-semibold text-gray-500 uppercase">Subject Grades</h3></div>
            <div className="divide-y divide-gray-50">
              {grades.map((g) => (
                <div key={g.subject} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{g.subject}</p>
                      <p className="text-xs text-gray-400">{g.teacher} • {g.exam}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{g.score}%</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getGradeColor(g.score)}`}>{g.grade}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${g.score >= 90 ? "bg-green-500" : g.score >= 80 ? "bg-blue-500" : g.score >= 70 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${g.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}