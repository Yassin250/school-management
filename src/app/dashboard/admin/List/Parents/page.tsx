"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/component/tables/DataTables";
import { Users, UserPlus, Phone, Mail } from "lucide-react";
import Link from "next/link";

type Parent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  children: string[];
  address: string;
};

const parentsData: Parent[] = [
  { id: "1", name: "Mary Johnson", email: "mary.j@email.com", phone: "+1 234-567-8901", children: ["Alice Johnson (4A)"], address: "123 Oak Street" },
  { id: "2", name: "Robert Williams", email: "robert.w@email.com", phone: "+1 234-567-8902", children: ["Bob Williams (4A)", "Emma Williams (1B)"], address: "456 Pine Avenue" },
  { id: "3", name: "Sarah Brown", email: "sarah.b@email.com", phone: "+1 234-567-8903", children: ["Charlie Brown (3B)"], address: "789 Elm Road" },
  { id: "4", name: "James Miller", email: "james.m@email.com", phone: "+1 234-567-8904", children: ["Diana Miller (5A)"], address: "321 Maple Lane" },
  { id: "5", name: "Laura Davis", email: "laura.d@email.com", phone: "+1 234-567-8905", children: ["Ethan Davis (2A)", "Sophie Davis (4B)"], address: "654 Birch Court" },
  { id: "6", name: "Mark Wilson", email: "mark.w@email.com", phone: "+1 234-567-8906", children: ["Fiona Wilson (5B)"], address: "987 Cedar Way" },
  { id: "7", name: "Emma Taylor", email: "emma.t@email.com", phone: "+1 234-567-8907", children: ["George Taylor (1A)"], address: "147 Walnut Drive" },
  { id: "8", name: "David Lee", email: "david.l@email.com", phone: "+1 234-567-8908", children: ["Hannah Lee (4B)", "Ryan Lee (2A)"], address: "258 Spruce Circle" },
  { id: "9", name: "Anna Martinez", email: "anna.m@email.com", phone: "+1 234-567-8909", children: ["Isaac Martinez (3A)"], address: "369 Willow Path" },
  { id: "10", name: "Peter Anderson", email: "peter.a@email.com", phone: "+1 234-567-8910", children: ["Julia Anderson (2B)"], address: "741 Ash Terrace" },
  { id: "11", name: "Lisa Thomas", email: "lisa.t@email.com", phone: "+1 234-567-8911", children: ["Kevin Thomas (5A)", "Nina Thomas (3B)"], address: "852 Elm Street" },
  { id: "12", name: "Carlos Garcia", email: "carlos.g@email.com", phone: "+1 234-567-8912", children: ["Luna Garcia (1B)"], address: "963 Oak Boulevard" },
];

const columns = [
  {
    header: "Name",
    accessor: (row: Parent) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-sm font-bold">
          {row.name.split(" ").map(n => n[0]).join("")}
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
    header: "Phone",
    accessor: (row: Parent) => (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Phone className="w-3.5 h-3.5 text-gray-400" />
        {row.phone}
      </div>
    ),
    sortable: true,
  },
  {
    header: "Children",
    accessor: (row: Parent) => (
      <div className="flex flex-wrap gap-1">
        {row.children.map((child) => (
          <span
            key={child}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
          >
            {child}
          </span>
        ))}
      </div>
    ),
  },
  {
    header: "Address",
    accessor: "address" as const,
    sortable: true,
    className: "text-sm text-gray-600 max-w-[200px] truncate",
  },
];

export default function ParentsListPage() {
  const router = useRouter();
  const [parents] = useState<Parent[]>(parentsData);

  const handleEdit = (parent: Parent) => {
    router.push(`/dashboard/admin/list/parents/${parent.id}/edit`);
  };
  const handleView = (parent: Parent) => {
  router.push(`/dashboard/admin/list/students/${parent.id}`);
}
  

  const handleDelete = async (parent: Parent) => {
    console.log("Deleting parent:", parent.id, parent.name);
  };

  const totalParents = parents.length;
  const totalChildren = parents.reduce((sum, p) => sum + p.children.length, 0);
  const parentsWithMultiple = parents.filter((p) => p.children.length > 1).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ========== PAGE HEADER ========== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage parent accounts and their linked children.
          </p>
        </div>
        <Link
          href="/dashboard/admin/list/parents/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm 
                     font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add Parent
        </Link>
      </div>

      {/* ========== STATS ROW ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalParents}</p>
              <p className="text-xs text-gray-500">Total Parents</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalChildren}</p>
              <p className="text-xs text-gray-500">Total Children</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{parentsWithMultiple}</p>
              <p className="text-xs text-gray-500">With Multiple Children</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== DATA TABLE ========== */}
      <DataTable
        columns={columns}
        data={parents}
        searchPlaceholder="Search by name, email, or phone..."
        searchFields={["name", "email", "phone"]}
        pageSize={10}
        onEdit={handleEdit}
        onRowClick={handleView}
        onDelete={handleDelete}
        getItemName={(parent) => parent.name}
        emptyState={{
          title: "No parents found",
          description: "Get started by adding the first parent to the system.",
          actionLabel: "Add Parent",
          actionHref: "/dashboard/admin/list/parents/new",
        }}
      />
    </div>
  );
}