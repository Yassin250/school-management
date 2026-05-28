// src/app/dashboard/admin/List/Announcements/AnnouncementsListClient.tsx
"use client";

import DataTable from "@/component/tables/DataTables";
import { deleteAnnouncement } from "@/lib/actions/announcement";
import { Megaphone, Calendar, School, Pin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type Announcement = {
  id: number;
  title: string;
  description: string;
  date: string;
  class: string;
};

const columns = [
  {
    header: "Announcement",
    accessor: (row: Announcement) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-700">
          <Megaphone className="w-4 h-4" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          <p className="text-xs text-gray-400 line-clamp-1">{row.description}</p>
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    header: "Date",
    accessor: (row: Announcement) => (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Calendar className="w-3.5 h-3.5 text-gray-400" />
        {new Date(row.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </div>
    ),
    sortable: true,
  },
  {
    header: "Audience",
    accessor: (row: Announcement) => (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
        row.class === "All School" 
          ? "bg-sky-50 text-sky-700" 
          : "bg-purple-50 text-purple-700"
      }`}>
        <School className="w-3 h-3" />
        {row.class}
      </span>
    ),
    sortable: true,
  },
  {
    header: "Status",
    accessor: (row: Announcement) => {
      const isNew = new Date(row.date) >= new Date(new Date().setDate(new Date().getDate() - 7));
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
          isNew ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
        }`}>
          {isNew ? "Recent" : "Older"}
        </span>
      );
    },
    sortable: true,
  },
];

export default function AnnouncementsListClient({ data }: { data: Announcement[] }) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState(data);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleEdit = (announcement: Announcement) => {
    router.push(`/dashboard/admin/list/announcements/${announcement.id}/edit`);
  };

  const handleView = (announcement: Announcement) => {
    router.push(`/dashboard/admin/list/announcements/${announcement.id}`);
  };

  const handleDelete = async (announcement: Announcement) => {
    setDeletingId(announcement.id);
    const result = await deleteAnnouncement(announcement.id);
    setDeletingId(null);

    if (result.success) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcement.id));
      toast.success(`"${announcement.title}" was deleted`);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete announcement");
    }
  };

  const totalAnnouncements = announcements.length;
  const allSchool = announcements.filter((a) => a.class === "All School").length;
  const classSpecific = announcements.filter((a) => a.class !== "All School").length;
  const recentAnnouncements = announcements.filter(
    (a) => new Date(a.date) >= new Date(new Date().setDate(new Date().getDate() - 7))
  ).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage school-wide and class-specific announcements.
          </p>
        </div>
        <Link
          href="/dashboard/admin/list/announcements/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-colors shadow-sm"
        >
          <Megaphone className="w-4 h-4" />
          New Announcement
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalAnnouncements}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Pin className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{recentAnnouncements}</p>
              <p className="text-xs text-gray-500">Recent (7 days)</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
              <School className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{allSchool}</p>
              <p className="text-xs text-gray-500">All School</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <School className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{classSpecific}</p>
              <p className="text-xs text-gray-500">Class Specific</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={announcements}
        searchPlaceholder="Search by title or description..."
        searchFields={["title", "description"]}
        pageSize={10}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRowClick={handleView}
        getItemName={(a) => a.title}
        deleteConfirmTitle="Delete announcement?"
        deleteConfirmDescription="This removes the announcement permanently."
        emptyState={{
          title: "No announcements found",
          description: "Get started by posting your first announcement.",
          actionLabel: "New Announcement",
          actionHref: "/dashboard/admin/list/announcements/new",
        }}
      />

      {deletingId && (
        <p className="text-xs text-gray-400 text-center">Deleting announcement...</p>
      )}
    </div>
  );
}