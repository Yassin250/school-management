"use client";

import EventForm from "@/component/forms/EventForm";

export default function NewEventPage() {
  return (
    <div className="p-6">
      <EventForm mode="create" />
    </div>
  );
}