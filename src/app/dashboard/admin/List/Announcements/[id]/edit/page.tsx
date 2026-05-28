"use client";

import { useParams } from "next/navigation";
import AnnouncementForm from "@/component/forms/AnnouncementForm";
import { announcementsData } from "@/lib/mockData";

export default function EditAnnouncementPage() {
  const params = useParams();
  const id = params.id as string;

  const announcement = announcementsData.find((a) => a.id === id);

  if (!announcement) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Announcement not found</h1>
        <p className="text-sm text-gray-500 mt-1">No announcement found with ID: {id}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <AnnouncementForm mode="update" data={announcement} />
    </div>
  );
}