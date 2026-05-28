"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/component/tables/DataTables";
import { Bell, Users, Pin, Clock } from "lucide-react";
import Link from "next/link";

type Announcement = {
  id: string;
  title: string;
  description: string;
  date: string;
  audience: "All" | "Teachers" | "Students" | "Parents";
  author: string;
  pinned: boolean;
  priority: "High" | "Medium" | "Low";
};

const announcementsData: Announcement[] = [
  { id: "1", title: "Staff Meeting Tomorrow", description: "All teachers must attend the staff meeting at 3:00 PM in the conference hall.", date: "2026-05-06", audience: "Teachers", author: "Principal Office", pinned: true, priority: "High" },
  { id: "2", title: "Mid-Term Exam Schedule Posted", description: "Mid-Term examination schedule is now available on the notice board and student portal.", date: "2026-05-05", audience: "All", author: "Dr. Sarah Wilson", pinned: true, priority: "High" },
  { id: "3", title: "Fee Payment Reminder", description: "Last date for 2nd installment fee payment is May 15. Late fees apply after the deadline.", date: "2026-05-04", audience: "Parents", author: "Finance Department", pinned: false, priority: "Medium" },
  { id: "4", title: "New Library Books Arrived", description: "The library has received 200 new books across various subjects. Students can visit during break hours.", date: "2026-05-03", audience: "Students", author: "Ms. Lisa Anderson", pinned: false, priority: "Low" },
  { id: "5", title: "Science Fair Registration Open", description: "Registration for the Annual Science Fair is now open. Submit projects by May 12.", date: "2026-05-02", audience: "Students", author: "Ms. Emily Davis", pinned: false, priority: "Medium" },
  { id: "6", title: "Parent-Teacher Meeting Schedule", description: "P-T meeting scheduled for May 20. Parents can book time slots via the parent portal.", date: "2026-05-01", audience: "Parents", author: "Dr. Sarah Wilson", pinned: false, priority: "High" },
  { id: "7", title: "Holiday Notice - Memorial Day", description: "School will remain closed on May 29 in observance of Memorial Day.", date: "2026-04-28", audience: "All", author: "Principal Office", pinned: true, priority: "Medium" },
  { id: "8", title: "Sports Day Volunteer Request", description: "Parent volunteers needed for Sports Day on May 25-26. Contact the PE department.", date: "2026-04-25", audience: "Parents", author: "Dr. Robert Taylor", pinned: false, priority: "Low" },
  { id: "9", title: "Teacher Training Workshop", description: "Mandatory training workshop on June 2 for all teaching staff. Register by May 25.", date: "2026-04-22", audience: "Teachers", author: "Mrs. Jennifer White", pinned: false, priority: "Medium" },
  { id: "10", title: "Canteen Menu Update", description: "New healthy meal options available starting next week. Check the updated menu online.", date: "2026-04-20", audience: "All", author: "Administration", pinned: false, priority: "Low" },
  { id: "11", title: "Exam Card Download Available", description: "Students can now download their Mid-Term exam cards from the student portal after fee clearance.", date: "2026-05-07", audience: "Students", author: "Finance Department", pinned: true, priority: "High" },
  { id: "12", title: "Art Exhibition Invitation", description: "Parents are invited to the annual art exhibition on June 18 showcasing student artwork.", date: "2026-04-18", audience: "Parents", author: "Ms. Lisa Anderson", pinned: false, priority: "Low" },
];

const columns = [
  {
    header: "Announcement",
    accessor: (row: Announcement) => (
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm ${
          row.priority === "High" ? "bg-red-100 text-red-700" :
          row.priority === "Medium" ? "bg-amber-100 text-amber-700" :
          "bg-green-100 text-green-700"
        }`}>
          {row.pinned ? <Pin className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{row.title}</p>
            {row.pinned && (
              <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-semibold">PINNED</span>
            )}
          </div>
          <p className="text-xs text-gray-400 line-clamp-1">{row.description}</p>
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    header: "Date",
    accessor: (row: Announcement) => (
      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        <Clock className="w-3.5 h-3.5 text-gray-400" />
        {new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </div>
    ),
    sortable: true,
  },
  {
    header: "Audience",
    accessor: (row: Announcement) => (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
        row.audience === "All" ? "bg-purple-50 text-purple-700" :
        row.audience === "Teachers" ? "bg-blue-50 text-blue-700" :
        row.audience === "Students" ? "bg-green-50 text-green-700" :
        "bg-orange-50 text-orange-700"
      }`}>
        <Users className="w-3 h-3" />
        {row.audience}
      </span>
    ),
  },
  {
    header: "Priority",
    accessor: (row: Announcement) => (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
        row.priority === "High" ? "bg-red-50 text-red-700" :
        row.priority === "Medium" ? "bg-amber-50 text-amber-700" :
        "bg-green-50 text-green-700"
      }`}>
        {row.priority}
      </span>
    ),
  },
  {
    header: "Author",
    accessor: "author" as const,
    sortable: true,
    className: "text-sm text-gray-600",
  },
];

export default function AnnouncementsListPage() {
  const router = useRouter();
  const [announcements] = useState<Announcement[]>(announcementsData);

  const handleEdit = (announcement: Announcement) => {
    router.push(`/dashboard/admin/list/announcements/${announcement.id}/edit`);
  };

  const handleDelete = async (announcement: Announcement) => {
    console.log("Deleting announcement:", announcement.id, announcement.title);
  };

  const totalAnnouncements = announcements.length;
  const pinnedCount = announcements.filter((a) => a.pinned).length;
  const highPriority = announcements.filter((a) => a.priority === "High").length;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ========== PAGE HEADER ========== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage school-wide announcements and notices.
          </p>
        </div>
        <Link
          href="/dashboard/admin/list/announcements/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm 
                     font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Bell className="w-4 h-4" />
          New Announcement
        </Link>
      </div>

      {/* ========== STATS ROW ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Bell className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalAnnouncements}</p>
              <p className="text-xs text-gray-500">Total Announcements</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Pin className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pinnedCount}</p>
              <p className="text-xs text-gray-500">Pinned</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{highPriority}</p>
              <p className="text-xs text-gray-500">High Priority</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== DATA TABLE ========== */}
      <DataTable
        columns={columns}
        data={announcements}
        searchPlaceholder="Search by title or author..."
        searchFields={["title", "description", "author"]}
        pageSize={8}
        onEdit={handleEdit}
        onDelete={handleDelete}
        getItemName={(announcement) => announcement.title}
        emptyState={{
          title: "No announcements found",
          description: "Create your first announcement to communicate with the school community.",
          actionLabel: "New Announcement",
          actionHref: "/dashboard/admin/list/announcements/new",
        }}
      />
    </div>
  );
}