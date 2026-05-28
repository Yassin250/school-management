// src/app/dashboard/admin/List/Events/[id]/edit/page.tsx
import EventForm from "@/component/forms/EventForm";
import { getEventRelatedData, mapEventToFormData } from "@/lib/data/event";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = parseInt(id);
  if (isNaN(eventId)) notFound();

  const [event, relatedData] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId }, include: { class: true } }),
    getEventRelatedData(),
  ]);

  if (!event) notFound();

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link href="/dashboard/admin/list/events" className="text-sm text-blue-600 hover:underline w-fit">
        ← Back to events
      </Link>
      <EventForm mode="update" data={mapEventToFormData(event)} relatedData={relatedData} />
    </div>
  );
}