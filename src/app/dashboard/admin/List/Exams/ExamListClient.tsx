// src/app/dashboard/admin/List/Exams/ExamsListClient.tsx
"use client";

import DataTable from "@/component/tables/DataTables";
import { deleteExam } from "@/lib/actions/exam";
import { FileText, Clock, BookOpen, School } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type Exam = {
  id: number;
  title: string;
  subject: string;
  class: string;
  startTime: string;
  endTime: string;
  results: number;
};

const columns = [
  {
    header: "Exam",
    accessor: (row: Exam) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 text-sm font-bold">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          <p className="text-xs text-gray-400">{row.subject} • {row.class}</p>
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    header: "Subject",
    accessor: (row: Exam) => (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700">
        {row.subject}
      </span>
    ),
    sortable: true,
  },
  {
    header: "Class",
    accessor: (row: Exam) => (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700">
        {row.class}
      </span>
    ),
    sortable: true,
  },
  {
    header: "Schedule",
    accessor: (row: Exam) => (
      <div className="text-sm text-gray-600">
        <p className="font-medium">{new Date(row.startTime).toLocaleDateString()}</p>
        <p className="text-xs text-gray-400">
          {new Date(row.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(row.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    ),
    sortable: true,
  },
  {
    header: "Results",
    accessor: (row: Exam) => (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-700">
        {row.results} {row.results === 1 ? "result" : "results"}
      </span>
    ),
    sortable: true,
  },
];

export default function ExamsListClient({ data }: { data: Exam[] }) {
  const router = useRouter();
  const [exams, setExams] = useState(data);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleEdit = (exam: Exam) => {
    router.push(`/dashboard/admin/list/exams/${exam.id}/edit`);
  };

  const handleView = (exam: Exam) => {
    router.push(`/dashboard/admin/list/exams/${exam.id}`);
  };

  const handleDelete = async (exam: Exam) => {
    setDeletingId(exam.id);
    const result = await deleteExam(exam.id);
    setDeletingId(null);

    if (result.success) {
      setExams((prev) => prev.filter((e) => e.id !== exam.id));
      toast.success(`${exam.title} was deleted`);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete exam");
    }
  };

  // Calculate stats
  const totalExams = exams.length;
  const upcomingExams = exams.filter(
    (e) => new Date(e.startTime) > new Date()
  ).length;
  const totalResults = exams.reduce((sum, e) => sum + e.results, 0);
  const uniqueSubjects = new Set(exams.map((e) => e.subject)).size;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage exams, schedules, and view results.
          </p>
        </div>
        <Link
          href="/dashboard/admin/list/exams/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-xl hover:bg-rose-700 transition-colors shadow-sm"
        >
          <FileText className="w-4 h-4" />
          Add Exam
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalExams}</p>
              <p className="text-xs text-gray-500">Total Exams</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{upcomingExams}</p>
              <p className="text-xs text-gray-500">Upcoming</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{uniqueSubjects}</p>
              <p className="text-xs text-gray-500">Subjects</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <School className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalResults}</p>
              <p className="text-xs text-gray-500">Total Results</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={exams}
        searchPlaceholder="Search by exam title, subject, or class..."
        searchFields={["title", "subject", "class"]}
        pageSize={10}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRowClick={handleView}
        getItemName={(exam) => exam.title}
        deleteConfirmTitle="Delete exam?"
        deleteConfirmDescription="This removes the exam. Results must be deleted first."
        emptyState={{
          title: "No exams found",
          description: "Get started by scheduling your first exam.",
          actionLabel: "Add Exam",
          actionHref: "/dashboard/admin/list/exams/new",
        }}
      />

      {deletingId && (
        <p className="text-xs text-gray-400 text-center">Deleting exam...</p>
      )}
    </div>
  );
}