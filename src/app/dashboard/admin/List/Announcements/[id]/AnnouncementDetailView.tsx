// src/app/dashboard/admin/List/Announcements/[id]/AnnouncementDetailView.tsx
"use client";

import { deleteAnnouncement } from "@/lib/actions/announcement";
import {
  ArrowLeft,
  Calendar,
  Megaphone,
  Pencil,
  School,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type AnnouncementDetail = {
  id: number;
  title: string;
  description: string;
  date: string;
  class: string;
};

export default function AnnouncementDetailView({
  announcement,
}: {
  announcement: AnnouncementDetail;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${announcement.title}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    const result = await deleteAnnouncement(announcement.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success("Announcement deleted");
      router.push("/dashboard/admin/list/announcements");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete");
    }
  };

  const formattedDate = new Date(announcement.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard/admin/list/announcements" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Announcements
      </Link>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 flex-shrink-0">
            <Megaphone className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{announcement.title}</h1>
            <p className="text-gray-500 mt-1">{announcement.class || "All School"}</p>
            <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {formattedDate}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/admin/list/announcements/${announcement.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700">
              <Pencil className="w-4 h-4" /> Edit
            </Link>
            <button onClick={handleDelete} disabled={isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 disabled:opacity-50">
              <Trash2 className="w-4 h-4" /> {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Message</h3>
        <p className="text-gray-700 leading-relaxed">{announcement.description}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Calendar className="w-5 h-5 text-sky-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900">{formattedDate.split(",")[0]}</p>
          <p className="text-xs text-gray-500">Date</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <School className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900">{announcement.class || "All School"}</p>
          <p className="text-xs text-gray-500">Audience</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Megaphone className="w-5 h-5 text-sky-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900">Active</p>
          <p className="text-xs text-gray-500">Status</p>
        </div>
      </div>
    </div>
  );
}