// ============================================================
// Navigation Configuration
// ============================================================
// Each nav item declares:
//   - requiredRoles: which roles see it (at least one)
//   - requiredPermission: optional permission check
//
// An item is visible if BOTH are satisfied.
// This is UX only. The server enforces the real permission.
// ============================================================

import type { Permission } from "@/lib/permissions/constants";

export interface NavItem {
  label: string;
  href: string;
  icon:
    | "dashboard"
    | "users"
    | "userCheck"
    | "book"
    | "calendar"
    | "clipboard"
    | "fileText"
    | "dollar"
    | "child";
  requiredRoles: string[];
  requiredPermission?: Permission;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  // ----------------------------------------------------------
  // Overview — everyone
  // ----------------------------------------------------------
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: "dashboard",
        requiredRoles: [
          "SYSTEM_ADMIN",
          "SCHOOL_ADMIN",
          "PRINCIPAL",
          "TEACHER",
          "ACCOUNTANT",
          "REGISTRAR",
          "PARENT",
          "STUDENT",
        ],
      },
    ],
  },

  // ----------------------------------------------------------
  // Teaching — teachers only
  // ----------------------------------------------------------
  {
    label: "Teaching",
    items: [
      {
        label: "My Classes",
        href: "/dashboard/teacher",
        icon: "book",
        requiredRoles: ["TEACHER"],
      },
      {
        label: "Attendance",
        href: "/dashboard/teacher/attendance",
        icon: "clipboard",
        requiredRoles: ["TEACHER"],
      },
      {
        label: "Timetable",
        href: "/dashboard/timetable",
        icon: "calendar",
        requiredRoles: [
          "TEACHER",
          "PRINCIPAL",
          "SCHOOL_ADMIN",
          "SYSTEM_ADMIN",
          "REGISTRAR",
        ],
      },
    ],
  },

  // ----------------------------------------------------------
  // Leadership — principal only
  // ----------------------------------------------------------
  {
    label: "Leadership",
    items: [
      {
        label: "Pending Reviews",
        href: "/dashboard/principal",
        icon: "fileText",
        requiredRoles: ["PRINCIPAL"],
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
        requiredRoles: ["SCHOOL_ADMIN", "REGISTRAR", "SYSTEM_ADMIN"],
      },
      {
        label: "Teachers",
        href: "/dashboard/admin/teachers",
        icon: "userCheck",
        requiredRoles: ["SCHOOL_ADMIN", "SYSTEM_ADMIN"],
      },
      {
        label: "Report Cards",
        href: "/dashboard/admin/reports",
        icon: "fileText",
        requiredRoles: ["SCHOOL_ADMIN", "PRINCIPAL", "REGISTRAR"],
      },
    ],
  },

  // ----------------------------------------------------------
    // ----------------------------------------------------------
  // Finance
  // ----------------------------------------------------------
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
        requiredRoles: ["ACCOUNTANT", "SCHOOL_ADMIN"],
      },
      {
        label: "Fee Structures",
        href: "/dashboard/admin/finance/fee-structures",
        icon: "fileText",
        requiredRoles: ["ACCOUNTANT", "SCHOOL_ADMIN"],
      },
    ],
  },

  // ----------------------------------------------------------
  // Family — parents only
  // ----------------------------------------------------------
  {
    label: "Family",
    items: [
      {
        label: "My Children",
        href: "/dashboard/parent",
        icon: "child",
        requiredRoles: ["PARENT"],
      },
    ],
  },

  // ----------------------------------------------------------
  // My Learning — students only
  // ----------------------------------------------------------
  {
    label: "My Learning",
    items: [
      {
        label: "My Grades",
        href: "/dashboard/student",
        icon: "book",
        requiredRoles: ["STUDENT"],
      },
      {
        label: "My Timetable",
        href: "/dashboard/timetable",
        icon: "calendar",
        requiredRoles: ["STUDENT"],
      },
    ],
  },
];