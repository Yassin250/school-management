// src/app/dashboard/admin/List/Events/new/page.tsx
import EventForm from "@/component/forms/EventForm";
import { getEventRelatedData } from "@/lib/data/event";
import Link from "next/link";

export default async function NewEventPage() {
  const relatedData = await getEventRelatedData();
  return (
    <div className="p-6 flex flex-col gap-4">
      <Link href="/dashboard/admin/list/events" className="text-sm text-blue-600 hover:underline w-fit">
        ← Back to events
      </Link>
      <EventForm mode="create" relatedData={relatedData} />
    </div>
  );
}