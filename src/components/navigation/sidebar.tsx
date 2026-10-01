"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  GraduationCap,
  Users,
  UserCheck,
  Calendar,
  Clock,
  FileSpreadsheet,
  CreditCard,
  FolderKanban,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  roles: string[];
}

export function Sidebar({ roles }: SidebarProps) {
  const pathname = usePathname();

  const isTeacher = roles.includes("TEACHER");
  const isPrincipal = roles.includes("PRINCIPAL");
  const isAdmin = roles.includes("SYSTEM_ADMIN") || roles.includes("SCHOOL_ADMIN");
  const isAccountant = roles.includes("ACCOUNTANT");
  const isRegistrar = roles.includes("REGISTRAR");
  const isStudent = roles.includes("STUDENT");
  const isParent = roles.includes("PARENT");

  const sections: NavSection[] = [];

  // Administration & Academic Operations
  if (isAdmin || isRegistrar) {
    sections.push({
      title: "Academic Operations",
      items: [
        { name: "Student Roster", href: "/dashboard/admin/students", icon: Users },
        { name: "Teacher Faculty", href: "/dashboard/admin/teachers", icon: UserCheck },
        { name: "Report Cards", href: "/dashboard/admin/report-cards", icon: FileSpreadsheet },
        { name: "Timetable Schedule", href: "/dashboard/timetable", icon: Clock },
      ],
    });
  }

  // Teacher navigation
  if (isTeacher) {
    sections.push({
      title: "Teacher Workspace",
      items: [
        { name: "My Classes", href: "/dashboard/teacher", icon: BookOpen },
        { name: "Daily Attendance", href: "/dashboard/teacher/attendance", icon: Calendar },
        { name: "Class Timetable", href: "/dashboard/timetable", icon: Clock },
      ],
    });
  }

  // Principal navigation
  if (isPrincipal) {
    sections.push({
      title: "Principal Leadership",
      items: [
        { name: "Pending Reviews", href: "/dashboard/principal", icon: FolderKanban },
        { name: "Report Cards & Approval", href: "/dashboard/admin/report-cards", icon: FileSpreadsheet },
      ],
    });
  }

  // Student navigation
  if (isStudent) {
    sections.push({
      title: "Student Portal",
      items: [
        { name: "My Grades & Marks", href: "/dashboard/student", icon: GraduationCap },
        { name: "My Timetable", href: "/dashboard/timetable", icon: Clock },
      ],
    });
  }

  // Parent navigation
  if (isParent) {
    sections.push({
      title: "Parent Portal",
      items: [
        { name: "Children Overview", href: "/dashboard/parent", icon: Users },
      ],
    });
  }

  // Accountant navigation
  if (isAccountant) {
    sections.push({
      title: "Finance & Accounts",
      items: [
        { name: "Fee Management", href: "/dashboard/accountant", icon: CreditCard },
      ],
    });
  }

  return (
    <aside className="w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </h3>
            <div className="mt-2 space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href + item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "text-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
