// src/app/dashboard/admin/List/Events/[id]/EventDetailView.tsx
"use client";

import { deleteEvent } from "@/lib/actions/event";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Pencil,
  School,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type EventDetail = {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  class: string;
};

export default function EventDetailView({
  event,
}: {
  event: EventDetail;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete ${event.title}? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteEvent(event.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success("Event deleted successfully");
      router.push("/dashboard/admin/list/events");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete event");
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const start = formatDateTime(event.startTime);
  const end = formatDateTime(event.endTime);
  const duration = Math.round(
    (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) /
      (1000 * 60)
  );
  const isUpcoming = new Date(event.startTime) > new Date();
  const isPast = new Date(event.endTime) < new Date();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link
        href="/dashboard/admin/list/events"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Link>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ${
              isPast ? "bg-gray-400" : isUpcoming ? "bg-green-500" : "bg-violet-500"
            }`}
          >
            <Calendar className="w-8 h-8" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isPast
                    ? "bg-gray-100 text-gray-600"
                    : isUpcoming
                    ? "bg-green-100 text-green-700"
                    : "bg-violet-100 text-violet-700"
                }`}
              >
                {isPast ? "Past" : isUpcoming ? "Upcoming" : "Ongoing"}
              </span>
            </div>
            <p className="text-gray-500 mt-1">
              {event.class || "All School Event"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/admin/list/events/${event.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Schedule
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-gray-500">Starts</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 ml-6">{start.date}</p>
              <p className="text-sm text-gray-500 ml-6">{start.time}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium text-gray-500">Ends</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 ml-6">{end.date}</p>
              <p className="text-sm text-gray-500 ml-6">{end.time}</p>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-medium text-gray-700">
                  Duration: {duration} minutes
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Details
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <School className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Audience</span>
              </div>
              <span className="ml-6 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                {event.class || "All School"}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-gray-700">Description</span>
              </div>
              <p className="text-sm text-gray-600 ml-6">{event.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Clock className="w-5 h-5 text-violet-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{duration}m</p>
          <p className="text-xs text-gray-500">Duration</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <School className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900 truncate">
            {event.class || "All School"}
          </p>
          <p className="text-xs text-gray-500">Audience</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Calendar className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900">{start.date.split(",")[0]}</p>
          <p className="text-xs text-gray-500">Day</p>
        </div>
      </div>
    </div>
  );
}