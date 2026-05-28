// src/lib/data/announcement.ts
import { prisma } from "@/lib/prisma";
import type { Announcement, Class } from "@/generated/prisma/client";

export async function getAnnouncementRelatedData() {
  const classes = await prisma.class.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return {
    classes: classes.map((c) => ({ id: c.id, name: c.name })),
  };
}

export function mapAnnouncementToFormData(
  announcement: Announcement & { class?: Class | null }
) {
  return {
    id: announcement.id,
    title: announcement.title,
    description: announcement.description,
    date: announcement.date.toISOString().split("T")[0],
    classId: announcement.classId ?? "",
  };
}

export type AnnouncementFormInitialData = ReturnType<typeof mapAnnouncementToFormData>;