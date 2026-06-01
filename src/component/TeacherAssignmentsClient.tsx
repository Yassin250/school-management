// src/component/TeacherAssignmentsClient.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Plus, Search, Calendar, Clock, CheckCircle, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createAssignment, deleteAssignment } from "@/lib/actions/assignment";

type LessonOption = {
  id: number;
  subjectName: string;
  className: string;
};

type AssignmentData = {
  id: number;
  title: string;
  subjectName: string;
  className: string;
  dueDate: Date;
  totalSubmissions: number;
  totalStudents: number;
};

type Props = {
  teacherName: string;
  lessons: LessonOption[];
  classes: string[];
  initialAssignments: AssignmentData[];
};

export default function TeacherAssignmentsClient({
  teacherName,
  lessons,
  classes,
  initialAssignments,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");

  // Form state
  const [title, setTitle] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    lessons[0]?.id.toString() || ""
  );
  const [dueDate, setDueDate] = useState("");

  const handleCreate = async () => {
    if (!title || !dueDate || !selectedLessonId) {
      toast.error("Title, lesson, and due date are required!");
      return;
    }

    startTransition(async () => {
      const res = await createAssignment({
        title,
        lessonId: parseInt(selectedLessonId),
        dueDateStr: dueDate,
      });

      if (res.success) {
        toast.success("Assignment created successfully!");
        setShowForm(false);
        setTitle("");
        setDueDate("");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to create assignment");
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this assignment? All associated grades will also be deleted.")) {
      return;
    }

    startTransition(async () => {
      const res = await deleteAssignment(id);
      if (res.success) {
        toast.success("Assignment deleted successfully!");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete assignment");
      }
    });
  };

  // Filter assignments
  const filteredAssignments = initialAssignments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === "all" || a.className === filterClass;
    return matchesSearch && matchesClass;
  });

  const activeAssignments = filteredAssignments.filter((a) => new Date(a.dueDate) >= new Date());
  const pastAssignments = filteredAssignments.filter((a) => new Date(a.dueDate) < new Date());

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
                {teacherName} • {activeAssignments.length} active, {pastAssignments.length} past
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Algebra Chapter 5"
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase block mb-1">Lesson *</label>
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.subjectName} for Class {l.className}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase block mb-1">Due Date *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isPending}
              className="px-4 py-2 bg-orange-600 text-white text-sm rounded-xl hover:bg-orange-700 disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create Assignment"}
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
          {classes.map((c) => (
            <option key={c} value={c}>Class {c}</option>
          ))}
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
            const submissionRate = assignment.totalStudents > 0 
              ? Math.round((assignment.totalSubmissions / assignment.totalStudents) * 100)
              : 0;

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
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-2">
                      <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {assignment.subjectName}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Class {assignment.className}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Due: {new Date(assignment.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
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
                      <Link
                        href={`/dashboard/teacher/grades?class=${assignment.className}&assignment=${assignment.id}`}
                        className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(assignment.id)}
                        disabled={isPending}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
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
