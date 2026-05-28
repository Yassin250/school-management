// src/app/dashboard/admin/List/Subjects/SubjectsListClient.tsx
"use client";

import DataTable from "@/component/tables/DataTables";
import { deleteSubject } from "@/lib/actions/subject";
import { BookOpen, Users, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type Subject = {
  id: number;
  name: string;
  teachers: string[];
  teacherCount: number;
  lessonCount: number;
};

const columns = [
  {
    header: "Subject",
    accessor: (row: Subject) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-sm font-bold">
          {row.name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-400">
            {row.teacherCount} {row.teacherCount === 1 ? "teacher" : "teachers"}
          </p>
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    header: "Teachers",
    accessor: (row: Subject) => (
      <div className="flex flex-wrap gap-1">
        {row.teachers.length > 0 ? (
          row.teachers.map((teacher) => (
            <span
              key={teacher}
              className="px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700"
            >
              {teacher}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400">No teachers assigned</span>
        )}
      </div>
    ),
  },
  {
    header: "Teachers",
    accessor: (row: Subject) => (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700">
        {row.teacherCount}
      </span>
    ),
    sortable: true,
  },
  {
    header: "Lessons",
    accessor: (row: Subject) => (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-700">
        {row.lessonCount}
      </span>
    ),
    sortable: true,
  },
];

export default function SubjectsListClient({ data }: { data: Subject[] }) {
  const router = useRouter();
  const [subjects, setSubjects] = useState(data);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleEdit = (subject: Subject) => {
    router.push(`/dashboard/admin/list/subjects/${subject.id}/edit`);
  };

  const handleView = (subject: Subject) => {
    router.push(`/dashboard/admin/list/subjects/${subject.id}`);
  };

  const handleDelete = async (subject: Subject) => {
    setDeletingId(subject.id);
    const result = await deleteSubject(subject.id);
    setDeletingId(null);

    if (result.success) {
      setSubjects((prev) => prev.filter((s) => s.id !== subject.id));
      toast.success(`${subject.name} was deleted`);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete subject");
    }
  };

  // Calculate stats
  const totalSubjects = subjects.length;
  const totalTeachers = new Set(subjects.flatMap((s) => s.teachers)).size;
  const totalLessons = subjects.reduce((sum, s) => sum + s.lessonCount, 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage subjects and assign teachers.
          </p>
        </div>
        <Link
          href="/dashboard/admin/list/subjects/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 transition-colors shadow-sm"
        >
          <BookOpen className="w-4 h-4" />
          Add Subject
        </Link>
      </div>

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
              <p className="text-2xl font-bold text-gray-900">{totalTeachers}</p>
              <p className="text-xs text-gray-500">Unique Teachers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalLessons}</p>
              <p className="text-xs text-gray-500">Total Lessons</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={subjects}
        searchPlaceholder="Search by subject name..."
        searchFields={["name"]}
        pageSize={10}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRowClick={handleView}
        getItemName={(subject) => subject.name}
        deleteConfirmTitle="Delete subject?"
        deleteConfirmDescription="This removes the subject. Lessons must be removed first."
        emptyState={{
          title: "No subjects found",
          description: "Get started by adding your first subject.",
          actionLabel: "Add Subject",
          actionHref: "/dashboard/admin/list/subjects/new",
        }}
      />

      {deletingId && (
        <p className="text-xs text-gray-400 text-center">Deleting subject...</p>
      )}
    </div>
  );
}