"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { studentsData } from "@/lib/mockData";
import { ArrowLeft, FileText, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter } from "lucide-react";
import Link from "next/link";

type Assignment = {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  dueDate: string;
  description: string;
  status: "submitted" | "pending" | "overdue" | "graded";
  score?: number;
  totalMarks?: number;
  submittedDate?: string;
  feedback?: string;
};

const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: "1", title: "Algebra Chapter 5", subject: "Mathematics", teacher: "John Doe", dueDate: "2026-05-20", description: "Complete exercises 1-20 from Chapter 5.", status: "pending" },
  { id: "2", title: "Physics Lab Report", subject: "Physics", teacher: "Jane Doe", dueDate: "2026-05-18", description: "Write a lab report on the pendulum experiment.", status: "submitted", submittedDate: "2026-05-17" },
  { id: "3", title: "English Essay", subject: "English", teacher: "Allen Black", dueDate: "2026-05-10", description: "500-word essay on your favorite book.", status: "graded", score: 88, totalMarks: 100, feedback: "Great analysis! Work on your conclusion." },
  { id: "4", title: "Chemistry Worksheet", subject: "Chemistry", teacher: "Jane Doe", dueDate: "2026-05-15", description: "Complete the periodic table worksheet.", status: "overdue" },
  { id: "5", title: "Biology Diagram", subject: "Biology", teacher: "Mike Geller", dueDate: "2026-05-22", description: "Draw and label the human digestive system.", status: "pending" },
  { id: "6", title: "History Timeline", subject: "History", teacher: "Jay French", dueDate: "2026-05-08", description: "Create a timeline of World War II events.", status: "graded", score: 72, totalMarks: 100, feedback: "Good effort, add more dates." },
  { id: "7", title: "Geometry Proofs", subject: "Mathematics", teacher: "John Doe", dueDate: "2026-05-12", description: "Prove theorems 1-5 from Chapter 4.", status: "graded", score: 95, totalMarks: 100, feedback: "Excellent work!" },
  { id: "8", title: "Geography Map Work", subject: "Geography", teacher: "Jay French", dueDate: "2026-05-25", description: "Label all countries on the world map.", status: "pending" },
];

export default function StudentAssignmentsPage() {
  const { data: session } = useSession();
  const studentId = session?.user?.id || "1";
  const student = studentsData.find((s) => s.id === studentId) || studentsData[0];

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Filter
  const filteredAssignments = MOCK_ASSIGNMENTS.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || a.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const total = MOCK_ASSIGNMENTS.length;
  const pending = MOCK_ASSIGNMENTS.filter((a) => a.status === "pending").length;
  const submitted = MOCK_ASSIGNMENTS.filter((a) => a.status === "submitted").length;
  const graded = MOCK_ASSIGNMENTS.filter((a) => a.status === "graded").length;
  const overdue = MOCK_ASSIGNMENTS.filter((a) => a.status === "overdue").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return "bg-blue-50 text-blue-700 border-blue-200";
      case "submitted": return "bg-amber-50 text-amber-700 border-amber-200";
      case "graded": return "bg-green-50 text-green-700 border-green-200";
      case "overdue": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-blue-500" />;
      case "submitted": return <CheckCircle className="w-4 h-4 text-amber-500" />;
      case "graded": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "overdue": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
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
            <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
            <p className="text-sm text-gray-500 mt-1">{student.name} • {total} assignments</p>
          </div>
        </div>

        {/* Summary Pills */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === "all" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            All ({total})
          </button>
          <button onClick={() => setFilterStatus("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === "pending" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}>
            Pending ({pending})
          </button>
          <button onClick={() => setFilterStatus("submitted")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === "submitted" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}>
            Submitted ({submitted})
          </button>
          <button onClick={() => setFilterStatus("graded")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === "graded" ? "bg-green-600 text-white" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>
            Graded ({graded})
          </button>
          <button onClick={() => setFilterStatus("overdue")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === "overdue" ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100"}`}>
            Overdue ({overdue})
          </button>
        </div>
      </div>

      {/* ========== SEARCH ========== */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title or subject..."
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* ========== ASSIGNMENT LIST ========== */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-gray-900">No Assignments</h3>
          <p className="text-sm text-gray-500">No assignments match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((assignment) => (
            <button
              key={assignment.id}
              onClick={() => setSelectedAssignment(selectedAssignment?.id === assignment.id ? null : assignment)}
              className="w-full bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-left hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusBadge(assignment.status)}`}>
                    {getStatusIcon(assignment.status)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{assignment.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{assignment.subject} • {assignment.teacher}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        Due: {new Date(assignment.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(assignment.status)}`}>
                        {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </span>
                      {assignment.score !== undefined && (
                        <span className="text-xs font-bold text-green-600">{assignment.score}/{assignment.totalMarks}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              {selectedAssignment?.id === assignment.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <p className="text-sm text-gray-600">{assignment.description}</p>
                  {assignment.submittedDate && (
                    <p className="text-xs text-gray-400">Submitted: {new Date(assignment.submittedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  )}
                  {assignment.feedback && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-xs font-medium text-blue-700 mb-1">Teacher Feedback:</p>
                      <p className="text-sm text-blue-600">{assignment.feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}