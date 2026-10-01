import Link from "next/link";
import { logoutAction } from "@/app/login/actions";

interface TopNavbarProps {
  user: {
    email: string;
    username: string;
    roles: string[];
  };
}

export function TopNavbar({ user }: TopNavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Context */}
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-bold text-neutral-900 transition hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-extrabold shadow-sm">
              RW
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-neutral-900">
                School Management
              </span>
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">
                Rwanda Curriculum
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-600">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>2026/2027 &bull; Term 1 (Active)</span>
          </div>
        </div>

        {/* User profile & controls */}
        <div className="flex items-center gap-3">
          {/* Role pills */}
          <div className="hidden sm:flex items-center gap-1.5">
            {user.roles.map((role) => (
              <span
                key={role}
                className="rounded-md bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 border border-neutral-200"
              >
                {role.replace(/_/g, " ")}
              </span>
            ))}
          </div>

          <div className="h-4 w-px bg-neutral-200 mx-1 hidden sm:block"></div>

          <span className="text-xs sm:text-sm font-medium text-neutral-800">
            {user.username}
          </span>

          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:text-neutral-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
