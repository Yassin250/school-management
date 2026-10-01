"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  name: string;
  href: string;
  icon: string;
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

  // Teacher navigation
  if (isTeacher) {
    sections.push({
      title: "Teacher Workspace",
      items: [
        { name: "My Classes", href: "/dashboard/teacher", icon: "🏫" },
        { name: "Assessments & Marks", href: "/dashboard/teacher", icon: "📝" },
      ],
    });
  }

  // Principal navigation
  if (isPrincipal) {
    sections.push({
      title: "Principal Leadership",
      items: [
        { name: "Pending Reviews", href: "/dashboard/principal", icon: "📋" },
      ],
    });
  }

  // Student navigation
  if (isStudent) {
    sections.push({
      title: "Student Portal",
      items: [
        { name: "My Grades & Marks", href: "/dashboard/student", icon: "🎓" },
      ],
    });
  }

  // Parent navigation
  if (isParent) {
    sections.push({
      title: "Parent Portal",
      items: [
        { name: "Children Overview", href: "/dashboard/parent", icon: "👨‍👩‍👧" },
      ],
    });
  }

  // Admin / Staff navigation
  if (isAdmin || isRegistrar || isAccountant) {
    const adminItems: NavItem[] = [];
    if (isAdmin) {
      adminItems.push({ name: "System Admin", href: "/dashboard/admin", icon: "[*]️" });
    }
    if (isRegistrar) {
      adminItems.push({ name: "Registrar Roster", href: "/dashboard/registrar", icon: "🗂️" });
    }
    if (isAccountant) {
      adminItems.push({ name: "Finance & Accounts", href: "/dashboard/accountant", icon: "💳" });
    }
    sections.push({
      title: "Administration",
      items: adminItems,
    });
  }

  return (
    <aside className="w-64 shrink-0 border-r border-neutral-200 bg-white min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {section.title}
            </h3>
            <div className="mt-2 space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href + item.name}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
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
