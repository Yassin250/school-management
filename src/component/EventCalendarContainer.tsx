import { Calendar, Clock } from "lucide-react";

const events = [
  {
    date: "08 May",
    title: "Mid-Term Exams Begin",
    time: "8:00 AM",
    color: "bg-red-100 text-red-700",
  },
  {
    date: "12 May",
    title: "Parent-Teacher Meeting",
    time: "2:00 PM",
    color: "bg-blue-100 text-blue-700",
  },
  {
    date: "15 May",
    title: "Science Fair",
    time: "10:00 AM",
    color: "bg-green-100 text-green-700",
  },
  {
    date: "20 May",
    title: "School Sports Day",
    time: "9:00 AM",
    color: "bg-purple-100 text-purple-700",
  },
  {
    date: "25 May",
    title: "Report Card Distribution",
    time: "11:00 AM",
    color: "bg-orange-100 text-orange-700",
  },
];

export default async function EventCalendarContainer({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;

  const selectedDate =
    params?.date || new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Upcoming Events
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">May 2026</p>
        </div>

        <Calendar className="w-5 h-5 text-gray-400" />
      </div>

      {/* Mini Calendar */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <span
              key={d}
              className="text-xs font-medium text-gray-400"
            >
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 31 }, (_, i) => (
            <span
              key={i}
              className={`text-xs py-1 rounded-md cursor-pointer transition-colors ${
                i + 1 === 8
                  ? "bg-blue-600 text-white font-medium"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {i + 1}
            </span>
          ))}
        </div>
      </div>

      {/* Event List */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">
          This Month
        </h4>

        {events.map((event, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center ${event.color}`}
            >
              <span className="text-xs font-bold">
                {event.date.split(" ")[0]}
              </span>

              <span className="text-[10px]">
                {event.date.split(" ")[1]}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {event.title}
              </p>

              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{event.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}