import { Bell, Pin } from "lucide-react";

const announcements = [
  { id: 1, title: "Staff Meeting Tomorrow", description: "All teachers must attend the staff meeting at 3:00 PM in the conference hall.", date: "1 day ago", pinned: true, color: "border-l-red-500" },
  { id: 2, title: "Exam Schedule Posted", description: "Mid-Term exam schedule is now available. Check the notice board for details.", date: "2 days ago", pinned: false, color: "border-l-blue-500" },
  { id: 3, title: "Fee Payment Reminder", description: "Last date for 2nd installment fee payment is May 15. Late fees apply after.", date: "3 days ago", pinned: false, color: "border-l-orange-500" },
  { id: 4, title: "New Library Books", description: "The library has received 200 new books across various subjects. Visit during break.", date: "4 days ago", pinned: false, color: "border-l-green-500" },
];

export default function Announcements() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Announcements</h3>
          <p className="text-sm text-gray-500 mt-0.5">Latest updates</p>
        </div>
        <Bell className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className={`border-l-4 ${ann.color} bg-gray-50 rounded-r-xl p-4 hover:bg-gray-100 transition-colors`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {ann.pinned && <Pin className="w-3.5 h-3.5 text-red-400" />}
                <h4 className="text-sm font-semibold text-gray-900">{ann.title}</h4>
              </div>
              <span className="text-[11px] text-gray-400 whitespace-nowrap">{ann.date}</span>
            </div>
            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{ann.description}</p>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors">
        View All Announcements
      </button>
    </div>
  );
}