// src/app/dashboard/admin/List/Students/StudentsListClient.tsx
"use client";

import DataTable from "@/component/tables/DataTables";
import { deleteStudent } from "@/lib/actions/student";
import { GraduationCap, School, UserCheck, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type Student = {
  id: string;
  name: string;
  email: string;
  studentId: string;
  class: string;
  parent: string;
  gender: "Male" | "Female";
  attendance: number;
};

const columns = [
  {
    header: "Name",
    accessor: (row: Student) => (
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${
            row.gender === "Male" ? "bg-blue-500" : "bg-pink-500"
          }`}
        >
          {row.name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-400">{row.email || "No email"}</p>
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    header: "Student ID",
    accessor: "studentId" as const,
    sortable: true,
    className: "text-sm font-mono text-gray-600",
  },
  {
    header: "Class",
    accessor: (row: Student) => (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700">
        {row.class}
      </span>
    ),
    sortable: true,
  },
  {
    header: "Parent",
    accessor: "parent" as const,
    sortable: true,
    className: "text-sm text-gray-600",
  },
  {
    header: "Attendance",
    accessor: (row: Student) => (
      <div className="flex items-center gap-2">
        <div className="w-16 bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              row.attendance >= 90
                ? "bg-green-500"
                : row.attendance >= 80
                ? "bg-amber-500"
                : "bg-red-500"
            }`}
            style={{ width: `${row.attendance}%` }}
          />
        </div>
        <span
          className={`text-xs font-semibold ${
            row.attendance >= 90
              ? "text-green-600"
              : row.attendance >= 80
              ? "text-amber-600"
              : "text-red-600"
          }`}
        >
          {row.attendance}%
        </span>
      </div>
    ),
  },
];

export default function StudentsListClient({ data }: { data: Student[] }) {
  const router = useRouter();
  const [students, setStudents] = useState(data);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (student: Student) => {
    router.push(`/dashboard/admin/list/students/${student.id}/edit`);
  };

  const handleView = (student: Student) => {
    router.push(`/dashboard/admin/list/students/${student.id}`);
  };

  const handleDelete = async (student: Student) => {
    setDeletingId(student.id);
    const result = await deleteStudent(student.id);
    setDeletingId(null);

    if (result.success) {
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
      toast.success(`${student.name} was deleted`);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete student");
    }
  };

  // Calculate stats from real data
  const totalStudents = students.length;
  const totalClasses = new Set(students.map((s) => s.class)).size;
  const avgAttendance =
    students.length > 0
      ? Math.round(
          students.reduce((sum, s) => sum + s.attendance, 0) / students.length
        )
      : 0;
  const maleCount = students.filter((s) => s.gender === "Male").length;
  const femaleCount = students.filter((s) => s.gender === "Female").length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage student enrollment, class assignments, and parent links.
          </p>
        </div>
        <Link
          href="/dashboard/admin/list/students/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <GraduationCap className="w-4 h-4" />
          Add Student
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {totalStudents}
              </p>
              <p className="text-xs text-gray-500">Total Students</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <School className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {totalClasses}
              </p>
              <p className="text-xs text-gray-500">Classes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {avgAttendance}%
              </p>
              <p className="text-xs text-gray-500">Avg Attendance</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {maleCount}/{femaleCount}
              </p>
              <p className="text-xs text-gray-500">Boys / Girls</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={students}
        searchPlaceholder="Search by name, email, or student ID..."
        searchFields={["name", "email", "studentId"]}
        pageSize={10}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRowClick={handleView}
        getItemName={(student) => student.name}
        deleteConfirmTitle="Delete student?"
        deleteConfirmDescription="This removes the student profile and login account. This cannot be undone."
        emptyState={{
          title: "No students found",
          description: "Get started by enrolling your first student.",
          actionLabel: "Add Student",
          actionHref: "/dashboard/admin/list/students/new",
        }}
      />

      {deletingId && (
        <p className="text-xs text-gray-400 text-center">
          Deleting student...
        </p>
      )}
    </div>
  );
}