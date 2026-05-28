// src/app/dashboard/admin/List/Announcements/new/page.tsx
import AnnouncementForm from "@/component/forms/AnnouncementForm";
import { getAnnouncementRelatedData } from "@/lib/data/announcement";
import Link from "next/link";

export default async function NewAnnouncementPage() {
  const relatedData = await getAnnouncementRelatedData();
  return (
    <div className="p-6 flex flex-col gap-4">
      <Link href="/dashboard/admin/list/announcements" className="text-sm text-blue-600 hover:underline w-fit">
        ← Back to announcements
      </Link>
      <AnnouncementForm mode="create" relatedData={relatedData} />
    </div>
  );
}