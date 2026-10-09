import type { Permission } from "@/lib/permissions/constants";

export type NavIconName =
  | "dashboard"
  | "users"
  | "userCheck"
  | "book"
  | "calendar"
  | "clipboard"
  | "fileText"
  | "dollar"
  | "child"
  | "megaphone"
  | "scale";

export interface NavItem {
  label: string;
  href: string;
  icon: NavIconName;
  requiredRoles: string[];
  requiredPermission?: Permission;
}

export interface NavSection { label: string; items: NavItem[]; }

// Navigation is discoverability only. Server-side permission checks are authoritative.
export const NAV_SECTIONS: NavSection[] = [
  { label: "System", items: [{ label: "System Dashboard", href: "/dashboard/system", icon: "dashboard", requiredRoles: ["SYSTEM_ADMIN"] }] },
  { label: "School Operations", items: [
    { label: "Operations Dashboard", href: "/dashboard/admin", icon: "dashboard", requiredRoles: ["SCHOOL_ADMIN"] },
    { label: "Students", href: "/dashboard/admin/students", icon: "users", requiredRoles: ["SCHOOL_ADMIN"] },
    { label: "Teachers", href: "/dashboard/admin/teachers", icon: "userCheck", requiredRoles: ["SCHOOL_ADMIN"] },
    { label: "Attendance Overview", href: "/dashboard/admin/attendance", icon: "clipboard", requiredRoles: ["SCHOOL_ADMIN"], requiredPermission: "attendance.reports" },
    { label: "Report Cards", href: "/dashboard/admin/reports", icon: "fileText", requiredRoles: ["SCHOOL_ADMIN", "PRINCIPAL"] },
  { label: "Grade Scales", href: "/dashboard/admin/grade-scales", icon: "scale", requiredRoles: ["SCHOOL_ADMIN"], requiredPermission: "grade_scales.read" },
    { label: "Timetable", href: "/dashboard/timetable", icon: "calendar", requiredRoles: ["SCHOOL_ADMIN", "PRINCIPAL"] },
  ] },
  { label: "Leadership", items: [
    { label: "Approvals", href: "/dashboard/principal", icon: "fileText", requiredRoles: ["PRINCIPAL"] },
    { label: "Attendance", href: "/dashboard/principal/attendance", icon: "clipboard", requiredRoles: ["PRINCIPAL"], requiredPermission: "attendance.reports" },
  ] },
  { label: "Teaching", items: [
    { label: "My Classes", href: "/dashboard/teacher", icon: "book", requiredRoles: ["TEACHER"] },
    { label: "Attendance", href: "/dashboard/teacher/attendance", icon: "clipboard", requiredRoles: ["TEACHER"] },
    { label: "My Timetable", href: "/dashboard/timetable", icon: "calendar", requiredRoles: ["TEACHER"] },
  ] },
  { label: "Finance", items: [
    { label: "Finance Status", href: "/dashboard/accountant", icon: "dollar", requiredRoles: ["ACCOUNTANT", "SCHOOL_ADMIN"] },
    { label: "Fee Structures", href: "/dashboard/accountant/fee-structures", icon: "fileText", requiredRoles: ["ACCOUNTANT"] },
    { label: "Invoices", href: "/dashboard/accountant/invoices", icon: "fileText", requiredRoles: ["ACCOUNTANT"] },
  ] },
  { label: "Family", items: [
    { label: "My Children", href: "/dashboard/parent", icon: "child", requiredRoles: ["PARENT"] },
    { label: "Attendance", href: "/dashboard/parent/attendance", icon: "clipboard", requiredRoles: ["PARENT"], requiredPermission: "attendance.read" },
    { label: "My Timetable", href: "/dashboard/timetable", icon: "calendar", requiredRoles: ["PARENT"] },
  ] },
  { label: "My Learning", items: [
    { label: "My Results", href: "/dashboard/student", icon: "book", requiredRoles: ["STUDENT"] },
    { label: "My Attendance", href: "/dashboard/student/attendance", icon: "clipboard", requiredRoles: ["STUDENT"], requiredPermission: "attendance.read" },
    { label: "My Timetable", href: "/dashboard/timetable", icon: "calendar", requiredRoles: ["STUDENT"] },
  ] },
  { label: "Communication", items: [{ label: "Announcements", href: "/dashboard/announcements", icon: "megaphone", requiredRoles: ["SYSTEM_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER", "ACCOUNTANT", "PARENT", "STUDENT"] }] },
];
