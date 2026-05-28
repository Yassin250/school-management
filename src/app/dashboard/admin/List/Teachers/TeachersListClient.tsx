"use client";

import DataTable from "@/component/tables/DataTables";
import { deleteTeacher } from "@/lib/actions/teacher";
import { BookOpen, GraduationCap, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type Teacher = {
  id: string;
  name: string;
  email: string;
  teacherId: string;
  subjects: string[];
  classes: string[];
};

const columns = [
  {
    header: "Name",
    accessor: (row: Teacher) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold">
          {row.name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-400">{row.email}</p>
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    header: "Username",
    accessor: "teacherId" as const,
    sortable: true,
    className: "text-sm font-mono text-gray-600",
  },
  {
    header: "Subjects",
    accessor: (row: Teacher) => (
      <div className="flex flex-wrap gap-1">
        {row.subjects.length > 0 ? (
          row.subjects.map((subject) => (
            <span
              key={subject}
              className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700"
            >
              {subject}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </div>
    ),
  },
  {
    header: "Classes",
    accessor: (row: Teacher) => (
      <div className="flex flex-wrap gap-1">
        {row.classes.length > 0 ? (
          row.classes.map((cls) => (
            <span
              key={cls}
              className="px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700"
            >
              {cls}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </div>
    ),
  },
];

export default function TeachersListClient({ data }: { data: Teacher[] }) {
  const router = useRouter();
  const [teachers, setTeachers] = useState(data);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (teacher: Teacher) => {
    router.push(`/dashboard/admin/list/teachers/${teacher.id}/edit`);
  };

  const handleView = (teacher: Teacher) => {
    router.push(`/dashboard/admin/list/teachers/${teacher.id}`);
  };

  const handleDelete = async (teacher: Teacher) => {
    setDeletingId(teacher.id);
    const result = await deleteTeacher(teacher.id);
    setDeletingId(null);

    if (result.success) {
      setTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
      toast.success(`${teacher.name} was deleted`);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete teacher");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage teachers, subjects, and class supervision.
          </p>
        </div>
        <Link
          href="/dashboard/admin/list/teachers/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Users className="w-4 h-4" />
          Add Teacher
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
              <p className="text-xs text-gray-500">Total Teachers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(teachers.flatMap((t) => t.subjects)).size}
              </p>
              <p className="text-xs text-gray-500">Unique Subjects</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(teachers.flatMap((t) => t.classes)).size}
              </p>
              <p className="text-xs text-gray-500">Classes Covered</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={teachers}
        searchPlaceholder="Search by name or email..."
        searchFields={["name", "email", "teacherId"]}
        pageSize={8}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRowClick={handleView}
        getItemName={(teacher) => teacher.name}
        deleteConfirmTitle="Delete teacher?"
        deleteConfirmDescription="This removes the teacher profile and login account. This cannot be undone."
        emptyState={{
          title: "No teachers found",
          description: "Get started by adding your first teacher.",
          actionLabel: "Add Teacher",
          actionHref: "/dashboard/admin/list/teachers/new",
        }}
      />

      {deletingId && (
        <p className="text-xs text-gray-400 text-center">Deleting teacher...</p>
      )}
    </div>
  );
}
