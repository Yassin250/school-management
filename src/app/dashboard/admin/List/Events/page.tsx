// src/app/dashboard/admin/List/Events/page.tsx
import { prisma } from "@/lib/prisma";
import EventsListClient from "./EventListClient";

export default async function EventsListPage() {
  const events = await prisma.event.findMany({
    include: {
      class: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const formattedEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    class: event.class?.name || "All School",
  }));

  return <EventsListClient data={formattedEvents} />;
}