// src/app/dashboard/admin/List/Announcements/page.tsx
import { prisma } from "@/lib/prisma";
import AnnouncementsListClient from "./AnnouncementsListClient";

export default async function AnnouncementsListPage() {
  const announcements = await prisma.announcement.findMany({
    include: { class: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  const formatted = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    date: a.date.toISOString(),
    class: a.class?.name || "All School",
  }));

  return <AnnouncementsListClient data={formatted} />;
}