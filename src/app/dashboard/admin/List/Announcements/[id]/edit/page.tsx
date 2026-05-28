// src/app/dashboard/admin/List/Announcements/[id]/edit/page.tsx
import AnnouncementForm from "@/component/forms/AnnouncementForm";
import { getAnnouncementRelatedData, mapAnnouncementToFormData } from "@/lib/data/announcement";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const annId = parseInt(id);
  if (isNaN(annId)) notFound();

  const [announcement, relatedData] = await Promise.all([
    prisma.announcement.findUnique({ where: { id: annId }, include: { class: true } }),
    getAnnouncementRelatedData(),
  ]);

  if (!announcement) notFound();

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link href="/dashboard/admin/list/announcements" className="text-sm text-blue-600 hover:underline w-fit">
        ← Back to announcements
      </Link>
      <AnnouncementForm mode="update" data={mapAnnouncementToFormData(announcement)} relatedData={relatedData} />
    </div>
  );
}