"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/component/tables/DataTables";
import { ClipboardCheck, School, Calendar, Clock } from "lucide-react";
import Link from "next/link";

type Exam = {
  id: string;
  name: string;
  type: "Mid-Term" | "Final" | "Unit Test" | "Pre-Board";
  startDate: string;
  endDate: string;
  classes: string[];
  subjects: number;
  status: "Upcoming" | "Ongoing" | "Completed";
};

const examsData: Exam[] = [
  { id: "1", name: "Mid-Term Examination", type: "Mid-Term", startDate: "2026-05-08", endDate: "2026-05-15", classes: ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5A", "5B"], subjects: 14, status: "Upcoming" },
  { id: "2", name: "Unit Test 1 - Mathematics", type: "Unit Test", startDate: "2026-04-20", endDate: "2026-04-20", classes: ["4A", "4B", "5A", "5B"], subjects: 1, status: "Completed" },
  { id: "3", name: "Unit Test 1 - Physics", type: "Unit Test", startDate: "2026-04-22", endDate: "2026-04-22", classes: ["4A", "4B", "5A", "5B"], subjects: 1, status: "Completed" },
  { id: "4", name: "Unit Test 2 - English", type: "Unit Test", startDate: "2026-06-10", endDate: "2026-06-10", classes: ["1A", "1B", "3A", "3B"], subjects: 1, status: "Upcoming" },
  { id: "5", name: "Final Examination", type: "Final", startDate: "2026-07-15", endDate: "2026-07-28", classes: ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5A", "5B"], subjects: 14, status: "Upcoming" },
  { id: "6", name: "Pre-Board - Grade 5", type: "Pre-Board", startDate: "2026-06-20", endDate: "2026-06-27", classes: ["5A", "5B"], subjects: 8, status: "Upcoming" },
  { id: "7", name: "Unit Test 1 - Chemistry", type: "Unit Test", startDate: "2026-04-25", endDate: "2026-04-25", classes: ["4A", "5B"], subjects: 1, status: "Completed" },
  { id: "8", name: "Unit Test 1 - Biology", type: "Unit Test", startDate: "2026-04-28", endDate: "2026-04-28", classes: ["3A", "3B", "4A", "5A", "5B"], subjects: 1, status: "Completed" },
];

const columns = [
  {
    header: "Exam",
    accessor: (row: Exam) => (
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
          row.type === "Mid-Term" ? "bg-blue-100 text-blue-700" :
          row.type === "Final" ? "bg-red-100 text-red-700" :
          row.type === "Pre-Board" ? "bg-purple-100 text-purple-700" :
          "bg-amber-100 text-amber-700"
        }`}>
          {row.name.split(" ").map(w => w[0]).slice(0, 3).join("")}
        </div>
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-400">{row.type}</p>
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    header: "Date",
    accessor: (row: Exam) => (
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-600">
          {new Date(row.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          {row.startDate !== row.endDate && 
            ` - ${new Date(row.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
          }
        </span>
      </div>
    ),
    sortable: true,
  },
  {
    header: "Classes",
    accessor: (row: Exam) => (
      <div className="flex flex-wrap gap-1">
        {row.classes.length > 5 ? (
          <>
            {row.classes.slice(0, 5).map((cls) => (
              <span key={cls} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                {cls}
              </span>
            ))}
            <span className="text-xs text-gray-400">+{row.classes.length - 5} more</span>
          </>
        ) : (
          row.classes.map((cls) => (
            <span key={cls} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
              {cls}
            </span>
          ))
        )}
      </div>
    ),
  },
  {
    header: "Subjects",
    accessor: (row: Exam) => (
      <div className="flex items-center gap-2">
        <ClipboardCheck className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-700">{row.subjects}</span>
      </div>
    ),
    sortable: true,
  },
  {
    header: "Status",
    accessor: (row: Exam) => (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
        row.status === "Upcoming" ? "bg-blue-50 text-blue-700" :
        row.status === "Ongoing" ? "bg-amber-50 text-amber-700" :
        "bg-green-50 text-green-700"
      }`}>
        {row.status === "Ongoing" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />}
        {row.status}
      </span>
    ),
  },
];

export default function ExamsListPage() {
  const router = useRouter();
  const [exams] = useState<Exam[]>(examsData);

  const handleEdit = (exam: Exam) => {
    router.push(`/dashboard/admin/list/exams/${exam.id}/edit`);
  };

  const handleDelete = async (exam: Exam) => {
    console.log("Deleting exam:", exam.id, exam.name);
  };

  const totalExams = exams.length;
  const upcomingExams = exams.filter((e) => e.status === "Upcoming").length;
  const ongoingExams = exams.filter((e) => e.status === "Ongoing").length;
  const completedExams = exams.filter((e) => e.status === "Completed").length;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ========== PAGE HEADER ========== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
          <p className="text-sm text-gray-500 mt-1">
            Schedule and manage examinations across all classes.
          </p>
        </div>
        <Link
          href="/dashboard/admin/list/exams/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm 
                     font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <ClipboardCheck className="w-4 h-4" />
          Create Exam
        </Link>
      </div>

      {/* ========== STATS ROW ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalExams}</p>
              <p className="text-xs text-gray-500">Total Exams</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{upcomingExams}</p>
              <p className="text-xs text-gray-500">Upcoming</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{ongoingExams}</p>
              <p className="text-xs text-gray-500">Ongoing</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedExams}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== DATA TABLE ========== */}
      <DataTable
        columns={columns}
        data={exams}
        searchPlaceholder="Search by exam name or type..."
        searchFields={["name", "type"]}
        pageSize={8}
        onEdit={handleEdit}
        onDelete={handleDelete}
        getItemName={(exam) => exam.name}
        emptyState={{
          title: "No exams found",
          description: "Schedule your first examination to get started.",
          actionLabel: "Create Exam",
          actionHref: "/dashboard/admin/list/exams/new",
        }}
      />
    </div>
  );
}