// src/app/dashboard/admin/List/Parents/ParentsListClient.tsx
"use client";

import DataTable from "@/component/tables/DataTables";
import { deleteParent } from "@/lib/actions/parent";
import { GraduationCap, Users, UserCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type Parent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  childrenCount: number;
  childrenNames: string[];
};

const columns = [
  {
    header: "Name",
    accessor: (row: Parent) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-bold">
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
    header: "Phone",
    accessor: "phone" as const,
    sortable: true,
    className: "text-sm text-gray-600",
  },
  {
    header: "Address",
    accessor: "address" as const,
    sortable: true,
    className: "text-sm text-gray-600 max-w-[200px] truncate",
  },
  {
    header: "Children",
    accessor: (row: Parent) => (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700">
          {row.childrenCount} {row.childrenCount === 1 ? "child" : "children"}
        </span>
        {row.childrenNames.length > 0 && (
          <span className="text-xs text-gray-400 hidden lg:inline truncate max-w-[150px]">
            {row.childrenNames.join(", ")}
          </span>
        )}
      </div>
    ),
    sortable: true,
  },
];

export default function ParentsListClient({ data }: { data: Parent[] }) {
  const router = useRouter();
  const [parents, setParents] = useState(data);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (parent: Parent) => {
    router.push(`/dashboard/admin/list/parents/${parent.id}/edit`);
  };

  const handleView = (parent: Parent) => {
    router.push(`/dashboard/admin/list/parents/${parent.id}`);
  };

  const handleDelete = async (parent: Parent) => {
    setDeletingId(parent.id);
    const result = await deleteParent(parent.id);
    setDeletingId(null);

    if (result.success) {
      setParents((prev) => prev.filter((p) => p.id !== parent.id));
      toast.success(`${parent.name} was deleted`);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete parent");
    }
  };

  // Calculate stats
  const totalParents = parents.length;
  const totalChildren = parents.reduce((sum, p) => sum + p.childrenCount, 0);
  const parentsWithChildren = parents.filter((p) => p.childrenCount > 0).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage parent accounts and their linked children.
          </p>
        </div>
        <Link
          href="/dashboard/admin/list/parents/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Users className="w-4 h-4" />
          Add Parent
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {totalParents}
              </p>
              <p className="text-xs text-gray-500">Total Parents</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {totalChildren}
              </p>
              <p className="text-xs text-gray-500">Total Children</p>
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
                {parentsWithChildren}
              </p>
              <p className="text-xs text-gray-500">With Children</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={parents}
        searchPlaceholder="Search by name, email, or phone..."
        searchFields={["name", "email", "phone"]}
        pageSize={10}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRowClick={handleView}
        getItemName={(parent) => parent.name}
        deleteConfirmTitle="Delete parent?"
        deleteConfirmDescription="This removes the parent profile and login account. Children must be reassigned first."
        emptyState={{
          title: "No parents found",
          description: "Get started by adding your first parent.",
          actionLabel: "Add Parent",
          actionHref: "/dashboard/admin/list/parents/new",
        }}
      />

      {deletingId && (
        <p className="text-xs text-gray-400 text-center">
          Deleting parent...
        </p>
      )}
    </div>
  );
}