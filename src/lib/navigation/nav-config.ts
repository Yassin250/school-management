// ============================================================
// Navigation Configuration
// ============================================================
// Every nav item declares the permission required to see it.
// The sidebar renders items where canForUser() returns true.
//
// This is NOT security. It's UX. The server enforces the real
// permission on every page and action.
// ============================================================

import type { Permission } from "@/lib/permissions/constants";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface NavItem {
  label: string;
  href: string;
  /** Optional icon name — used by the sidebar component. */
  icon:
    | "dashboard"
    | "users"
    | "userCheck"
    | "book"
    | "calendar"
    | "clipboard"
    | "fileText"
    | "dollar"
    | "megaphone"
    | "shield"
    | "settings"
    | "child";
  /** Permission required to display this item. Null = always shown. */
  requiredPermission: Permission | null;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

// ------------------------------------------------------------
// Nav sections
// ------------------------------------------------------------

export const NAV_SECTIONS: NavSection[] = [
  // ----------------------------------------------------------
  // Common — visible to everyone
  // ----------------------------------------------------------
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: "dashboard",
        requiredPermission: null,
      },
    ],
  },

  // ----------------------------------------------------------
  // Teacher workspace
  // ----------------------------------------------------------
  {
    label: "Teaching",
    items: [
      {
        label: "My Classes",
        href: "/dashboard/teacher",
        icon: "book",
        requiredPermission: "teacher_assignments.read",
      },
      {
        label: "Attendance",
        href: "/dashboard/teacher/attendance",
        icon: "clipboard",
        requiredPermission: "attendance.create",
      },
      {
        label: "Timetable",
        href: "/dashboard/timetable",
        icon: "calendar",
        requiredPermission: "timetable.read",
      },
    ],
  },

  // ----------------------------------------------------------
  // Principal leadership
  // ----------------------------------------------------------
  {
    label: "Leadership",
    items: [
      {
        label: "Pending Reviews",
        href: "/dashboard/principal",
        icon: "fileText",
        requiredPermission: "grades.review",
      },
    ],
  },

  // ----------------------------------------------------------
  // Administration
  // ----------------------------------------------------------
  {
    label: "Administration",
    items: [
      {
        label: "Students",
        href: "/dashboard/admin/students",
        icon: "users",
        requiredPermission: "students.create",
      },
      {
        label: "Teachers",
        href: "/dashboard/admin/teachers",
        icon: "userCheck",
        requiredPermission: "teachers.create",
      },
      {
        label: "Report Cards",
        href: "/dashboard/admin/reports",
        icon: "fileText",
        requiredPermission: "report_cards.generate",
      },
      {
        label: "System Settings",
        href: "/dashboard/admin",
        icon: "settings",
        requiredPermission: "system.read",
      },
    ],
  },

  // ----------------------------------------------------------
  // Finance
  // ----------------------------------------------------------
  {
    label: "Finance",
    items: [
      {
        label: "Overview",
        href: "/dashboard/accountant",
        icon: "dollar",
        requiredPermission: "financial_reports.read",
      },
    ],
  },

  // ----------------------------------------------------------
  // Parent portal
  // ----------------------------------------------------------
  {
    label: "Family",
    items: [
      {
        label: "My Children",
        href: "/dashboard/parent",
        icon: "child",
        requiredPermission: "parents.read",
      },
    ],
  },

  // ----------------------------------------------------------
  // Student portal
  // ----------------------------------------------------------
  {
    label: "My Learning",
    items: [
      {
        label: "My Grades",
        href: "/dashboard/student",
        icon: "book",
        requiredPermission: "grades.read",
      },
      {
        label: "My Timetable",
        href: "/dashboard/timetable",
        icon: "calendar",
        requiredPermission: "timetable.read",
      },
    ],
  },
];