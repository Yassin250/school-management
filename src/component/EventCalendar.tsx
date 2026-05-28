"use client";

import { useState } from "react";
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

const events = [
  {
    id: 1,
    title: "Science Fair",
    date: "2026-05-10",
    time: "10:00 AM",
    location: "Main Hall",
    color: "bg-green-100 text-green-700 border-green-300",
    dotColor: "bg-green-500",
  },
  {
    id: 2,
    title: "Math Quiz",
    date: "2026-05-12",
    time: "2:00 PM",
    location: "Room 204",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    dotColor: "bg-blue-500",
  },
  {
    id: 3,
    title: "Parent Meeting",
    date: "2026-05-15",
    time: "5:00 PM",
    location: "Auditorium",
    color: "bg-purple-100 text-purple-700 border-purple-300",
    dotColor: "bg-purple-500",
  },
  {
    id: 4,
    title: "Sports Day",
    date: "2026-05-20",
    time: "9:00 AM",
    location: "Playground",
    color: "bg-orange-100 text-orange-700 border-orange-300",
    dotColor: "bg-orange-500",
  },
];

const EventCalendar = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const monthName = new Date(currentYear, currentMonth).toLocaleString("default", {
    month: "long",
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Check if a date has events
  const getDateEvents = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  // Filter events for selected date
  const filteredEvents = selectedDate
    ? events.filter((e) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
        return e.date === dateStr;
      })
    : events;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Calendar</h3>
        </div>
        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
          {monthName} {currentYear}
        </span>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm font-medium text-gray-700">{monthName}</span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {/* Empty cells for previous month */}
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {/* Date cells */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const isToday =
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();
          const dayEvents = getDateEvents(day);
          const isSelected = selectedDate === day;

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : day)}
              className={`relative aspect-square flex items-center justify-center text-sm rounded-lg transition-all hover:bg-gray-100 ${
                isToday
                  ? "bg-blue-600 text-white hover:bg-blue-700 font-bold"
                  : isSelected
                  ? "bg-gray-200 text-gray-900 font-medium"
                  : "text-gray-700"
              }`}
            >
              {day}
              {dayEvents.length > 0 && !isToday && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {dayEvents.map((_, i) => (
                    <span
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        dayEvents[0].dotColor
                      }`}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Event List */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {selectedDate
            ? `Events on ${selectedDate} ${monthName}`
            : "Upcoming Events"}
        </h4>
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`p-3 rounded-xl border ${event.color} transition-colors`}
            >
              <p className="text-sm font-medium">{event.title}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1 text-xs opacity-70">
                  <Clock className="w-3 h-3" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-1 text-xs opacity-70">
                  <MapPin className="w-3 h-3" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            No events for this date
          </p>
        )}
      </div>
    </div>
  );
};

export default EventCalendar;