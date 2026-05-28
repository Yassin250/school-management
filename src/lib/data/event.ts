// src/lib/data/event.ts
import { prisma } from "@/lib/prisma";
import type { Event, Class } from "@/generated/prisma/client";

export async function getEventRelatedData() {
  const classes = await prisma.class.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return {
    classes: classes.map((c) => ({ id: c.id, name: c.name })),
  };
}

export function mapEventToFormData(
  event: Event & { class?: Class | null }
) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startTime: event.startTime.toISOString().slice(0, 16),
    endTime: event.endTime.toISOString().slice(0, 16),
    classId: event.classId ?? "",
  };
}

export type EventFormInitialData = ReturnType<typeof mapEventToFormData>;