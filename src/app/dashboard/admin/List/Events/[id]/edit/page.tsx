"use client";

import { useParams } from "next/navigation";
import EventForm from "@/component/forms/EventForm";
import { eventsData } from "@/lib/mockData";

export default function EditEventPage() {
  const params = useParams();
  const id = params.id as string;

  const event = eventsData.find((e) => e.id === id);

  if (!event) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Event not found</h1>
        <p className="text-sm text-gray-500 mt-1">No event found with ID: {id}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <EventForm mode="update" data={event} />
    </div>
  );
}