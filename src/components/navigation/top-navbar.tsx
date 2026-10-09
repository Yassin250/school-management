import Link from "next/link";
import { logoutAction } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { getRoleLabel } from "@/lib/navigation/roles";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { NotificationBell } from "@/components/navigation/notification-bell";
import {
  listMyNotifications,
  unreadNotificationCount,
} from "@/lib/services/notifications/list";

interface TopNavbarProps {
  user: {
    email: string;
    username: string;
    roles: string[];
  };
}

export async function TopNavbar({ user }: TopNavbarProps) {
  // Prefetch notifications server-side for instant badge on load
  let initialUnreadCount = 0;
  let initialNotifications: Awaited<ReturnType<typeof listMyNotifications>> = [];

  try {
    [initialNotifications, initialUnreadCount] = await Promise.all([
      listMyNotifications(15),
      unreadNotificationCount(),
    ]);
  } catch {
    // Not logged in or DB not ready — bell renders with 0
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Context */}
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-bold text-foreground transition hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold shadow-sm">
              RW
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-foreground">
                School Management
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                Rwanda Curriculum
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>2026/2027 &bull; Term 1 (Active)</span>
          </div>
        </div>

        {/* User profile, theme toggle & controls */}
        <div className="flex items-center gap-3">
          {/* Role badges — friendly display names */}
          <div className="hidden sm:flex items-center gap-1.5">
            {user.roles.map((role) => (
              <Badge
                key={role}
                variant="secondary"
                className="text-[11px] font-medium"
              >
                {getRoleLabel(role)}
              </Badge>
            ))}
          </div>

          {/* Notification Bell */}
          <NotificationBell
            initialUnreadCount={initialUnreadCount}
            initialNotifications={initialNotifications}
          />

          <ThemeToggle />

          <div className="h-4 w-px bg-border mx-1 hidden sm:block"></div>

          <span className="text-xs sm:text-sm font-medium text-foreground">
            {user.username}
          </span>

          <form action={logoutAction}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}