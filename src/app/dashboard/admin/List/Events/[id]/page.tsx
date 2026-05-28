// src/app/dashboard/admin/List/Events/[id]/page.tsx
import EventDetailView from "./EventDetailView";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = parseInt(id);
  if (isNaN(eventId)) notFound();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { class: { select: { name: true } } },
  });

  if (!event) notFound();

  return (
    <EventDetailView
      event={{
        id: event.id,
        title: event.title,
        description: event.description,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        class: event.class?.name || "All School",
      }}
    />
  );
}