"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Clock, ExternalLink } from "lucide-react";

// Pure helper — lives outside the component so Date.now() is not called during render
function formatRelativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
import {
  getNotificationsStateAction,
  markReadAction,
  markAllReadAction,
} from "@/lib/services/notifications/actions";
import type { NotificationItemView } from "@/lib/services/notifications/list";

interface NotificationBellProps {
  initialUnreadCount?: number;
  initialNotifications?: NotificationItemView[];
}

export function NotificationBell({
  initialUnreadCount = 0,
  initialNotifications = [],
}: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState<NotificationItemView[]>(initialNotifications);
  const [, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Refresh notifications when opened
  const toggleOpen = () => {
    if (!isOpen) {
      startTransition(async () => {
        const res = await getNotificationsStateAction();
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      });
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: string, link?: string | null) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markReadAction(id);
    if (link) {
      setIsOpen(false);
      router.push(link);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })),
    );
    setUnreadCount(0);
    await markAllReadAction();
  };



  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={toggleOpen}
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-xs animate-in zoom-in-50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border bg-card p-0 shadow-2xl text-card-foreground z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs font-medium">No notifications right now.</p>
                <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                  You&apos;re all caught up with classes and announcements!
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readAt;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n.id, n.link)}
                    className={`p-3 text-xs transition-colors cursor-pointer hover:bg-muted/40 ${
                      isUnread ? "bg-primary/[0.03] font-medium" : "text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {isUnread && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></span>
                        )}
                        <span className={`text-xs ${isUnread ? "font-bold text-foreground" : "font-medium"}`}>
                          {n.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/70 shrink-0 flex items-center gap-0.5 font-mono">
                        <Clock className="h-2.5 w-2.5" />
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed pl-3">
                      {n.body}
                    </p>

                    {n.link && (
                      <div className="mt-1.5 pl-3 flex items-center gap-1 text-[10px] text-primary hover:underline">
                        <span>View details</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
