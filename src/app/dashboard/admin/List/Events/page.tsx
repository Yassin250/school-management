"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/component/tables/DataTables";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";

type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  audience: "All" | "Teachers" | "Students" | "Parents" | "Staff";
  organizer: string;
};

const eventsData: Event[] = [
  { id: "1", title: "Annual Science Fair", date: "2026-05-15", time: "10:00 AM - 2:00 PM", location: "Main Hall", audience: "All", organizer: "Ms. Emily Davis" },
  { id: "2", title: "Parent-Teacher Meeting", date: "2026-05-20", time: "2:00 PM - 5:00 PM", location: "Auditorium", audience: "Parents", organizer: "Dr. Sarah Wilson" },
  { id: "3", title: "Sports Day - Junior", date: "2026-05-25", time: "9:00 AM - 12:00 PM", location: "Sports Ground", audience: "Students", organizer: "Dr. Robert Taylor" },
  { id: "4", title: "Sports Day - Senior", date: "2026-05-26", time: "9:00 AM - 12:00 PM", location: "Sports Ground", audience: "Students", organizer: "Dr. Robert Taylor" },
  { id: "5", title: "Teacher Training Workshop", date: "2026-06-02", time: "10:00 AM - 3:00 PM", location: "Conference Room", audience: "Teachers", organizer: "Mrs. Jennifer White" },
  { id: "6", title: "Independence Day Celebration", date: "2026-06-14", time: "8:00 AM - 11:00 AM", location: "School Grounds", audience: "All", organizer: "Mrs. Anna Martinez" },
  { id: "7", title: "Art Exhibition", date: "2026-06-18", time: "10:00 AM - 4:00 PM", location: "Art Room & Hallway", audience: "All", organizer: "Ms. Lisa Anderson" },
  { id: "8", title: "Music & Dance Competition", date: "2026-06-22", time: "1:00 PM - 5:00 PM", location: "Auditorium", audience: "All", organizer: "Ms. Lisa Anderson" },
  { id: "9", title: "Staff Meeting", date: "2026-06-30", time: "3:00 PM - 4:30 PM", location: "Conference Room", audience: "Staff", organizer: "Principal Office" },
  { id: "10", title: "New Parent Orientation", date: "2026-07-05", time: "10:00 AM - 12:00 PM", location: "Auditorium", audience: "Parents", organizer: "Mrs. Anna Martinez" },
  { id: "11", title: "Farewell - Grade 5", date: "2026-07-10", time: "11:00 AM - 2:00 PM", location: "Main Hall", audience: "Students", organizer: "Mr. Michael Lee" },
  { id: "12", title: "Summer Camp Begins", date: "2026-07-15", time: "8:00 AM onwards", location: "School Campus", audience: "Students", organizer: "Dr. Robert Taylor" },
];

const columns = [
  {
    header: "Event",
    accessor: (row: Event) => (
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
          row.audience === "All" ? "bg-purple-100 text-purple-700" :
          row.audience === "Teachers" ? "bg-blue-100 text-blue-700" :
          row.audience === "Students" ? "bg-green-100 text-green-700" :
          row.audience === "Parents" ? "bg-orange-100 text-orange-700" :
          "bg-gray-100 text-gray-700"
        }`}>
          {row.title.split(" ").map(w => w[0]).slice(0, 3).join("")}
        </div>
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          <p className="text-xs text-gray-400">by {row.organizer}</p>
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    header: "Date & Time",
    accessor: (row: Event) => (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-sm text-gray-700">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          {new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          {row.time}
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    header: "Location",
    accessor: (row: Event) => (
      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        <MapPin className="w-3.5 h-3.5 text-gray-400" />
        {row.location}
      </div>
    ),
    sortable: true,
  },
  {
    header: "Audience",
    accessor: (row: Event) => (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
        row.audience === "All" ? "bg-purple-50 text-purple-700" :
        row.audience === "Teachers" ? "bg-blue-50 text-blue-700" :
        row.audience === "Students" ? "bg-green-50 text-green-700" :
        row.audience === "Parents" ? "bg-orange-50 text-orange-700" :
        "bg-gray-50 text-gray-700"
      }`}>
        <Users className="w-3 h-3" />
        {row.audience}
      </span>
    ),
  },
];

export default function EventsListPage() {
  const router = useRouter();
  const [events] = useState<Event[]>(eventsData);

  const handleEdit = (event: Event) => {
    router.push(`/dashboard/admin/list/events/${event.id}/edit`);
  };

  const handleDelete = async (event: Event) => {
    console.log("Deleting event:", event.id, event.title);
  };

  const totalEvents = events.length;
  const upcomingEvents = events.filter((e) => new Date(e.date) >= new Date()).length;
  const pastEvents = events.filter((e) => new Date(e.date) < new Date()).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ========== PAGE HEADER ========== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">
            Schedule and manage school events, celebrations, and meetings.
          </p>
        </div>
        <Link
          href="/dashboard/admin/list/events/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm 
                     font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Calendar className="w-4 h-4" />
          Add Event
        </Link>
      </div>

      {/* ========== STATS ROW ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalEvents}</p>
              <p className="text-xs text-gray-500">Total Events</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{upcomingEvents}</p>
              <p className="text-xs text-gray-500">Upcoming</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pastEvents}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== DATA TABLE ========== */}
      <DataTable
        columns={columns}
        data={events}
        searchPlaceholder="Search by event title or location..."
        searchFields={["title", "location", "organizer"]}
        pageSize={10}
        onEdit={handleEdit}
        onDelete={handleDelete}
        getItemName={(event) => event.title}
        emptyState={{
          title: "No events found",
          description: "Schedule your first school event to get started.",
          actionLabel: "Add Event",
          actionHref: "/dashboard/admin/list/events/new",
        }}
      />
    </div>
  );
}