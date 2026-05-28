"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
}

const BigCalendar = ({ events }: { events: CalendarEvent[] }) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [title, setTitle] = useState("");

  // Map events to FullCalendar format
  const mappedEvents = events.map((event) => ({
    id: event.id.toString(),
    title: event.title,
    start: event.start,
    end: event.end,
    backgroundColor: getSubjectColor(event.title),
    borderColor: "transparent",
    textColor: "#1F2937",
    classNames: ["rounded-lg", "text-xs", "font-medium", "p-1", "border-none", "shadow-sm"],
  }));

  const handlePrev = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.prev();
    setTitle(calendarApi?.view.title || "");
  };

  const handleNext = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.next();
    setTitle(calendarApi?.view.title || "");
  };

  const handleToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.today();
    setTitle(calendarApi?.view.title || "");
  };

  return (
    <div>
      {/* Custom Toolbar */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-base font-semibold text-gray-900 min-w-[150px] text-center">
            {title || "May 4 - 10, 2026"}
          </h2>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <button
          onClick={handleToday}
          className="px-4 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Calendar */}
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={false}
        events={mappedEvents}
        slotMinTime="07:00:00"
        slotMaxTime="18:00:00"
        allDaySlot={false}
        height="auto"
        slotLabelFormat={{
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }}
        dayHeaderFormat={{ weekday: "short", day: "numeric" }}
        slotEventOverlap={false}
        nowIndicator={true}
        editable={false}
        selectable={false}
        dayMaxEvents={3}
        views={{
          timeGridWeek: {
            titleFormat: { year: "numeric", month: "long", day: "numeric" },
          },
        }}
        viewDidMount={(arg) => {
          setTitle(arg.view.title);
        }}
      />
    </div>
  );
};

// Helper: assign colors based on subject name
function getSubjectColor(subject: string): string {
  const colors: Record<string, string> = {
    Mathematics: "#DBEAFE",    // blue-100
    English: "#D1FAE5",        // emerald-100
    Physics: "#FEF3C7",        // amber-100
    Chemistry: "#EDE9FE",      // violet-100
    Biology: "#CCFBF1",        // teal-100
    "Computer Science": "#FCE7F3", // pink-100
    History: "#FEE2E2",        // red-100
    Geography: "#E0E7FF",      // indigo-100
  };
  return colors[subject] || "#F3F4F6"; // gray-100 default
}

export default BigCalendar;