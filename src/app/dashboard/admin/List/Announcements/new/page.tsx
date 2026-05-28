"use client";

import AnnouncementForm from "@/component/forms/AnnouncementForm";

export default function NewAnnouncementPage() {
  return (
    <div className="p-6">
      <AnnouncementForm mode="create" />
    </div>
  );
}