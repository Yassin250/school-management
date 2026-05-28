// src/app/dashboard/admin/List/Announcements/[id]/page.tsx
import AnnouncementDetailView from "./AnnouncementDetailView";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const annId = parseInt(id);
  if (isNaN(annId)) notFound();

  const announcement = await prisma.announcement.findUnique({
    where: { id: annId },
    include: { class: { select: { name: true } } },
  });

  if (!announcement) notFound();

  return (
    <AnnouncementDetailView
      announcement={{
        id: announcement.id,
        title: announcement.title,
        description: announcement.description,
        date: announcement.date.toISOString(),
        class: announcement.class?.name || "All School",
      }}
    />
  );
}