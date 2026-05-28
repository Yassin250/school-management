"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { teachersData, studentsData } from "@/lib/mockData";
import { ArrowLeft, FileText, Plus, Search, Calendar, Clock, CheckCircle, XCircle, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Assignment = {
  id: string;
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  description: string;
  totalSubmissions: number;
  totalStudents: number;
};

export default function TeacherAssignmentsPage() {
  const { data: session } = useSession();
  const teacherId = session?.user?.id || "1";
  const teacher = teachersData.find((t) => t.id === teacherId);
  const myClassNames = teacher?.classes || [];
  const mySubjects = teacher?.subjects || [];

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");

  // Form state
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    subject: mySubjects[0] || "",
    className: myClassNames[0] || "",
    dueDate: "",
    description: "",
  });

  // Mock assignments
  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: "1", title: "Algebra Chapter 5", subject: "Math", className: "1B",
      dueDate: "2026-05-20", description: "Complete exercises 1-20 from Chapter 5.",
      totalSubmissions: 15, totalStudents: 20,
    },
    {
      id: "2", title: "Physics Lab Report", subject: "Physics", className: "5A",
      dueDate: "2026-05-18", description: "Write a lab report on the pendulum experiment.",
      totalSubmissions: 14, totalStudents: 16,
    },
    {
      id: "3", title: "English Essay", subject: "English", className: "3C",
      dueDate: "2026-05-22", description: "500-word essay on your favorite book.",
      totalSubmissions: 10, totalStudents: 18,
    },
  ]);

  // Filter assignments
  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === "all" || a.className === filterClass;
    return matchesSearch && matchesClass;
  });

  // Create assignment
  const handleCreate = () => {
    if (!newAssignment.title || !newAssignment.dueDate) {
      toast.error("Title and due date are required!");
      return;
    }

    const totalStudents = studentsData.filter(
      (s) => s.class === newAssignment.className
    ).length;

    const assignment: Assignment = {
      id: Date.now().toString(),
      title: newAssignment.title,
      subject: newAssignment.subject,
      className: newAssignment.className,
      dueDate: newAssignment.dueDate,
      description: newAssignment.description,
      totalSubmissions: 0,
      totalStudents,
    };

    setAssignments([assignment, ...assignments]);
    setShowForm(false);
    setNewAssignment({ title: "", subject: mySubjects[0], className: myClassNames[0], dueDate: "", description: "" });
    toast.success("Assignment created successfully!");
  };

  // Delete assignment
  const handleDelete = (id: string) => {
    setAssignments(assignments.filter((a) => a.id !== id));
    toast.success("Assignment deleted!");
  };

  // Active vs Past
  const activeAssignments = assignments.filter((a) => new Date(a.dueDate) >= new Date());
  const pastAssignments = assignments.filter((a) => new Date(a.dueDate) < new Date());

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
            <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center">
              <FileText className="w-7 h-7 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
              <p className="text-sm text-gray-500 mt-1">
                {teacher.name} • {activeAssignments.length} active, {pastAssignments.length} past
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-xl hover:bg-orange-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Assignment
          </button>
        </div>
      </div>

      {/* ========== CREATE FORM ========== */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Create New Assignment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase block mb-1">Title *</label>
              <input
                type="text"
                value={newAssignment.title}
                onChange={(e) => setNewAssignment((p) => ({ ...p, title: e.target.value }))}
                placeholder="Algebra Chapter 5"
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase block mb-1">Subject</label>
              <select
                value={newAssignment.subject}
                onChange={(e) => setNewAssignment((p) => ({ ...p, subject: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm"
              >
                {mySubjects.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase block mb-1">Class</label>
              <select
                value={newAssignment.className}
                onChange={(e) => setNewAssignment((p) => ({ ...p, className: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm"
              >
                {myClassNames.map((c) => (<option key={c} value={c}>Class {c}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase block mb-1">Due Date *</label>
              <input
                type="date"
                value={newAssignment.dueDate}
                onChange={(e) => setNewAssignment((p) => ({ ...p, dueDate: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 uppercase block mb-1">Description</label>
              <textarea
                value={newAssignment.description}
                onChange={(e) => setNewAssignment((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="Instructions for the assignment..."
                className="w-full p-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-xl hover:bg-gray-200">
              Cancel
            </button>
            <button onClick={handleCreate} className="px-4 py-2 bg-orange-600 text-white text-sm rounded-xl hover:bg-orange-700">
              Create Assignment
            </button>
          </div>
        </div>
      )}

      {/* ========== FILTERS ========== */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search assignments..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="h-10 px-3 rounded-xl border border-gray-200 text-sm"
        >
          <option value="all">All Classes</option>
          {myClassNames.map((c) => (<option key={c} value={c}>Class {c}</option>))}
        </select>
      </div>

      {/* ========== ASSIGNMENT LIST ========== */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-gray-900">No Assignments</h3>
          <p className="text-sm text-gray-500">Create your first assignment to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const isOverdue = new Date(assignment.dueDate) < new Date();
            const submissionRate = Math.round((assignment.totalSubmissions / assignment.totalStudents) * 100);

            return (
              <div key={assignment.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">Overdue</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{assignment.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {assignment.subject}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Class {assignment.className}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due: {new Date(assignment.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Submission Stats */}
                    <div className="text-center">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-bold text-gray-700">{assignment.totalSubmissions}/{assignment.totalStudents}</span>
                      </div>
                      <div className="w-24 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${submissionRate}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{submissionRate}% submitted</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(assignment.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}