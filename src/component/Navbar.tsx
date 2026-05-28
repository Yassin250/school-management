"use client";

import { useSession } from "next-auth/react";
import { Bell, MessageSquare, Search, Menu } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [showSearch, setShowSearch] = useState(false);

  const firstName = session?.user?.name?.split(" ")[0] || "User";
  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white p-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        {/* Left: Greeting */}
        <div className="flex items-center gap-4">
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="hidden sm:block">
            <h2 className="text-lg font-semibold text-gray-800">
              Good {getGreeting()}, {firstName}
            </h2>
            <p className="text-sm text-gray-500">{today}</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          {showSearch ? (
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                autoFocus
                onBlur={() => setShowSearch(false)}
                className="pl-9 pr-4 py-2 w-48 md:w-64 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {/* Messages */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User Avatar */}
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-gray-200">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
              {initials}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-800">
                {firstName}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {session?.user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}