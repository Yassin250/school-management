"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/component/tables/DataTables";
import { BookOpen, Users, School, Clock } from "lucide-react";
import Link from "next/link";

type Subject = {
  id: string;
  name: string;
  code: string;
  teachers: string[];
  classes: string[];
  periodsPerWeek: number;
};

const subjectsData: Subject[] = [
  { id: "1", name: "Mathematics", code: "MATH-101", teachers: ["Dr. Sarah Wilson", "Prof. Kevin Harris"], classes: ["4A", "4B", "5A", "5B"], periodsPerWeek: 5 },
  { id: "2", name: "English Literature", code: "ENG-101", teachers: ["Prof. James Brown", "Ms. Rachel Clark"], classes: ["1A", "1B", "3A", "3B"], periodsPerWeek: 5 },
  { id: "3", name: "Physics", code: "PHY-101", teachers: ["Dr. Sarah Wilson", "Prof. Kevin Harris"], classes: ["4A", "4B", "5A", "5B"], periodsPerWeek: 4 },
  { id: "4", name: "Chemistry", code: "CHM-101", teachers: ["Ms. Emily Davis"], classes: ["4A", "5B"], periodsPerWeek: 4 },
  { id: "5", name: "Biology", code: "BIO-101", teachers: ["Ms. Emily Davis", "Mr. Daniel Lewis"], classes: ["3A", "3B", "4A", "5A", "5B"], periodsPerWeek: 4 },
  { id: "6", name: "Computer Science", code: "CS-101", teachers: ["Mr. Michael Lee"], classes: ["4A", "4B", "5A", "5B"], periodsPerWeek: 3 },
  { id: "7", name: "History", code: "HIS-101", teachers: ["Mrs. Anna Martinez"], classes: ["2A", "2B", "3A", "3B"], periodsPerWeek: 3 },
  { id: "8", name: "Geography", code: "GEO-101", teachers: ["Mrs. Anna Martinez"], classes: ["2A", "2B", "3A"], periodsPerWeek: 3 },
  { id: "9", name: "French", code: "FRN-101", teachers: ["Mrs. Jennifer White"], classes: ["3A", "4A", "5A"], periodsPerWeek: 3 },
  { id: "10", name: "Spanish", code: "SPN-101", teachers: ["Mrs. Jennifer White"], classes: ["3B", "4B", "5B"], periodsPerWeek: 3 },
  { id: "11", name: "Economics", code: "ECO-101", teachers: ["Mr. David Thomas"], classes: ["5A", "5B"], periodsPerWeek: 3 },
  { id: "12", name: "Art", code: "ART-101", teachers: ["Ms. Lisa Anderson"], classes: ["1A", "1B", "2A", "2B"], periodsPerWeek: 2 },
  { id: "13", name: "Music", code: "MUS-101", teachers: ["Ms. Lisa Anderson"], classes: ["1A", "1B", "2A", "2B"], periodsPerWeek: 2 },
  { id: "14", name: "Physical Education", code: "PE-101", teachers: ["Dr. Robert Taylor"], classes: ["1A", "2A", "3A", "4A", "5A", "1B", "2B", "3B", "4B", "5B"], periodsPerWeek: 2 },
];

const columns = [
  {
    header: "Subject",
    accessor: (row: Subject) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 text-sm font-bold">
          {row.code.split("-")[0].slice(0, 3)}
        </div>
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-400 font-mono">{row.code}</p>
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    header: "Teachers",
    accessor: (row: Subject) => (
      <div className="flex flex-wrap gap-1">
        {row.teachers.map((teacher) => (
          <span
            key={teacher}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
          >
            {teacher}
          </span>
        ))}
      </div>
    ),
  },
  {
    header: "Classes",
    accessor: (row: Subject) => (
      <div className="flex flex-wrap gap-1">
        {row.classes.map((cls) => (
          <span
            key={cls}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700"
          >
            {cls}
          </span>
        ))}
      </div>
    ),
  },
  {
    header: "Periods/Week",
    accessor: (row: Subject) => (
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-700">{row.periodsPerWeek}</span>
      </div>
    ),
    sortable: true,
  },
];

export default function SubjectsListPage() {
  const router = useRouter();
  const [subjects] = useState<Subject[]>(subjectsData);

  const handleEdit = (subject: Subject) => {
    router.push(`/dashboard/admin/list/subjects/${subject.id}/edit`);
  };

  const handleDelete = async (subject: Subject) => {
    console.log("Deleting subject:", subject.id, subject.name);
  };

  const totalSubjects = subjects.length;
  const uniqueTeachers = new Set(subjects.flatMap((s) => s.teachers)).size;
  const totalPeriods = subjects.reduce((sum, s) => sum + s.periodsPerWeek, 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ========== PAGE HEADER ========== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage subjects, assign teachers, and configure class schedules.
          </p>
        </div>
        <Link
          href="/dashboard/admin/list/subjects/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm 
                     font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <BookOpen className="w-4 h-4" />
          Add Subject
        </Link>
      </div>

      {/* ========== STATS ROW ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalSubjects}</p>
              <p className="text-xs text-gray-500">Total Subjects</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{uniqueTeachers}</p>
              <p className="text-xs text-gray-500">Assigned Teachers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalPeriods}</p>
              <p className="text-xs text-gray-500">Total Periods/Week</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== DATA TABLE ========== */}
      <DataTable
        columns={columns}
        data={subjects}
        searchPlaceholder="Search by name or code..."
        searchFields={["name", "code"]}
        pageSize={10}
        onEdit={handleEdit}
        onDelete={handleDelete}
        getItemName={(subject) => subject.name}
        emptyState={{
          title: "No subjects found",
          description: "Get started by adding the first subject to the curriculum.",
          actionLabel: "Add Subject",
          actionHref: "/dashboard/admin/list/subjects/new",
        }}
      />
    </div>
  );
}