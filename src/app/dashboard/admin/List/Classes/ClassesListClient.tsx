// src/app/dashboard/admin/List/Classes/ClassesListClient.tsx
"use client";

import DataTable from "@/component/tables/DataTables";
import { deleteClass } from "@/lib/actions/class";
import { School, Users, UserCheck, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type Class = {
  id: number;
  name: string;
  capacity: number;
  grade: string;
  supervisor: string;
  students: number;
};

const columns = [
  {
    header: "Class",
    accessor: (row: Class) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold">
          {row.name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-400">{row.grade}</p>
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    header: "Capacity",
    accessor: (row: Class) => (
      <div className="flex items-center gap-2">
        <div className="w-16 bg-gray-100 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-indigo-500"
            style={{ width: `${Math.min((row.students / row.capacity) * 100, 100)}%` }}
          />
        </div>
        <span className="text-sm text-gray-600">
          {row.students}/{row.capacity}
        </span>
      </div>
    ),
    sortable: true,
  },
  {
    header: "Supervisor",
    accessor: (row: Class) => (
      <span className="text-sm text-gray-600">
        {row.supervisor || <span className="text-gray-400">Not assigned</span>}
      </span>
    ),
    sortable: true,
  },
  {
    header: "Students",
    accessor: (row: Class) => (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700">
        {row.students} {row.students === 1 ? "student" : "students"}
      </span>
    ),
    sortable: true,
  },
];

export default function ClassesListClient({ data }: { data: Class[] }) {
  const router = useRouter();
  const [classes, setClasses] = useState(data);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleEdit = (cls: Class) => {
    router.push(`/dashboard/admin/list/classes/${cls.id}/edit`);
  };

  const handleView = (cls: Class) => {
    router.push(`/dashboard/admin/list/classes/${cls.id}`);
  };

  const handleDelete = async (cls: Class) => {
    setDeletingId(cls.id);
    const result = await deleteClass(cls.id);
    setDeletingId(null);

    if (result.success) {
      setClasses((prev) => prev.filter((c) => c.id !== cls.id));
      toast.success(`${cls.name} was deleted`);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete class");
    }
  };

  // Calculate stats
  const totalClasses = classes.length;
  const totalStudents = classes.reduce((sum, c) => sum + c.students, 0);
  const totalCapacity = classes.reduce((sum, c) => sum + c.capacity, 0);
  const classesWithSupervisor = classes.filter((c) => c.supervisor !== "Not assigned").length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage classes, capacity, grade levels, and supervisor assignments.
          </p>
        </div>
        <Link
          href="/dashboard/admin/list/classes/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <School className="w-4 h-4" />
          Add Class
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <School className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalClasses}</p>
              <p className="text-xs text-gray-500">Total Classes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              <p className="text-xs text-gray-500">Total Students</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCapacity}</p>
              <p className="text-xs text-gray-500">Total Capacity</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {classesWithSupervisor}/{totalClasses}
              </p>
              <p className="text-xs text-gray-500">With Supervisor</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={classes}
        searchPlaceholder="Search by class name or supervisor..."
        searchFields={["name", "supervisor", "grade"]}
        pageSize={10}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRowClick={handleView}
        getItemName={(cls) => cls.name}
        deleteConfirmTitle="Delete class?"
        deleteConfirmDescription="This removes the class. Students and lessons must be reassigned first."
        emptyState={{
          title: "No classes found",
          description: "Get started by adding your first class.",
          actionLabel: "Add Class",
          actionHref: "/dashboard/admin/list/classes/new",
        }}
      />

      {deletingId && (
        <p className="text-xs text-gray-400 text-center">Deleting class...</p>
      )}
    </div>
  );
}