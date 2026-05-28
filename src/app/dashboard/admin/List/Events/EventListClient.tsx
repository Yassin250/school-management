// src/app/dashboard/admin/List/Events/EventsListClient.tsx
"use client";

import DataTable from "@/component/tables/DataTables";
import { deleteEvent } from "@/lib/actions/event";
import { Calendar, Clock, MapPin, School } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type Event = {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  class: string;
};

const columns = [
  {
    header: "Event",
    accessor: (row: Event) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-bold">
          <Calendar className="w-4 h-4" />
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
    accessor: (row: Event) => (
      <div className="text-sm text-gray-600">
        <p className="font-medium">
          {new Date(row.startTime).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <p className="text-xs text-gray-400">
          {new Date(row.startTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    ),
    sortable: true,
  },
  {
    header: "End",
    accessor: (row: Event) => (
      <div className="text-sm text-gray-600">
        <p className="font-medium">
          {new Date(row.endTime).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </p>
        <p className="text-xs text-gray-400">
          {new Date(row.endTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    ),
    sortable: true,
  },
  {
    header: "Class",
    accessor: (row: Event) => (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700">
        {row.class || "All School"}
      </span>
    ),
    sortable: true,
  },
];

export default function EventsListClient({ data }: { data: Event[] }) {
  const router = useRouter();
  const [events, setEvents] = useState(data);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleEdit = (event: Event) => {
    router.push(`/dashboard/admin/list/events/${event.id}/edit`);
  };

  const handleView = (event: Event) => {
    router.push(`/dashboard/admin/list/events/${event.id}`);
  };

  const handleDelete = async (event: Event) => {
    setDeletingId(event.id);
    const result = await deleteEvent(event.id);
    setDeletingId(null);

    if (result.success) {
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      toast.success(`${event.title} was deleted`);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete event");
    }
  };

  const totalEvents = events.length;
  const upcomingEvents = events.filter(
    (e) => new Date(e.startTime) > new Date()
  ).length;
  const allSchoolEvents = events.filter((e) => !e.class || e.class === "All School").length;
  const classEvents = events.filter((e) => e.class && e.class !== "All School").length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage school events, schedules, and activities.
          </p>
        </div>
        <Link
          href="/dashboard/admin/list/events/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors shadow-sm"
        >
          <Calendar className="w-4 h-4" />
          Add Event
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalEvents}</p>
              <p className="text-xs text-gray-500">Total Events</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{upcomingEvents}</p>
              <p className="text-xs text-gray-500">Upcoming</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <School className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{allSchoolEvents}</p>
              <p className="text-xs text-gray-500">All School</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{classEvents}</p>
              <p className="text-xs text-gray-500">Class Specific</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={events}
        searchPlaceholder="Search by event title..."
        searchFields={["title", "description", "class"]}
        pageSize={10}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRowClick={handleView}
        getItemName={(event) => event.title}
        deleteConfirmTitle="Delete event?"
        deleteConfirmDescription="This removes the event permanently."
        emptyState={{
          title: "No events found",
          description: "Get started by creating your first event.",
          actionLabel: "Add Event",
          actionHref: "/dashboard/admin/list/events/new",
        }}
      />

      {deletingId && (
        <p className="text-xs text-gray-400 text-center">Deleting event...</p>
      )}
    </div>
  );
}