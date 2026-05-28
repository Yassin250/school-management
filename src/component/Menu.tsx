"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard,
  Users,
  UserPlus,
  BookOpen,
  School,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Award,
  Clock,
  Calendar,
  MessageSquare,
  Bell,
  User,
  Settings,
  LogOut,
  Banknote,
  Library,
  TrendingUp,
} from "lucide-react";

const menuItems = [
  {
    title: "MENU",
    items: [
      // ===== ALL ROLES =====
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/admin", visible: ["admin"] },
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/teacher", visible: ["teacher"] },
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/student", visible: ["student"] },
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/parent", visible: ["parent"] },

      // ===== ADMIN LINKS =====
      { icon: Users, label: "Teachers", href: "/dashboard/admin/list/teachers", visible: ["admin"] },
      { icon: UserPlus, label: "Students", href: "/dashboard/admin/list/students", visible: ["admin"] },
      { icon: Users, label: "Parents", href: "/dashboard/admin/list/parents", visible: ["admin"] },
      { icon: School, label: "Classes", href: "/dashboard/admin/list/classes", visible: ["admin"] },
      { icon: BookOpen, label: "Subjects", href: "/dashboard/admin/list/subjects", visible: ["admin"] },
      { icon: ClipboardCheck, label: "Exams", href: "/dashboard/admin/list/exams", visible: ["admin"] },
      { icon: Calendar, label: "Events", href: "/dashboard/admin/list/events", visible: ["admin"] },
      { icon: Bell, label: "Announcements", href: "/dashboard/admin/list/announcements", visible: ["admin"] },
      { icon: Banknote, label: "Finance", href: "/dashboard/admin/finance", visible: ["admin"] },
      { icon: Library, label: "Library", href: "/dashboard/admin/library", visible: ["admin"] },

      // ===== TEACHER LINKS =====
      { icon: Users, label: "My Students", href: "/dashboard/teacher/list/students", visible: ["teacher"] },
      { icon: School, label: "My Classes", href: "/dashboard/teacher/my-classes", visible: ["teacher"] },
      { icon: Clock, label: "Attendance", href: "/dashboard/teacher/attendance", visible: ["teacher"] },
      { icon: Award, label: "Grades", href: "/dashboard/teacher/grades", visible: ["teacher"] },
      { icon: FileText, label: "Assignments", href: "/dashboard/teacher/assignments", visible: ["teacher"] },
      { icon: ClipboardCheck, label: "Exams", href: "/dashboard/teacher/exams", visible: ["teacher"] },
      { icon: Calendar, label: "Timetable", href: "/dashboard/teacher/timetable", visible: ["teacher"] },

      // ===== STUDENT LINKS =====
      { icon: Calendar, label: "Timetable", href: "/dashboard/student/timetable", visible: ["student"] },
      { icon: Clock, label: "Attendance", href: "/dashboard/student/attendance", visible: ["student"] },
      { icon: TrendingUp, label: "Grades", href: "/dashboard/student/grades", visible: ["student"] },
      { icon: FileText, label: "Assignments", href: "/dashboard/student/assignments", visible: ["student"] },
      { icon: ClipboardCheck, label: "Exams", href: "/dashboard/student/exams", visible: ["student"] },
      { icon: Banknote, label: "Fees", href: "/dashboard/student/fees", visible: ["student"] },
      { icon: Library, label: "Library", href: "/dashboard/student/library", visible: ["student"] },

      // ===== PARENT LINKS =====
      // ===== PARENT LINKS =====
{ icon: Users, label: "My Children", href: "/dashboard/parent", visible: ["parent"] },
{ icon: Clock, label: "Attendance", href: "/dashboard/parent/attendance", visible: ["parent"] },
{ icon: TrendingUp, label: "Grades", href: "/dashboard/parent/grades", visible: ["parent"] },
{ icon: Banknote, label: "Fees", href: "/dashboard/parent/fees", visible: ["parent"] },

      // ===== SHARED =====
      { icon: MessageSquare, label: "Messages", href: "/dashboard/messages", visible: ["admin", "teacher", "student", "parent"] },
    ],
  },
  {
    title: "OTHER",
    items: [
      { icon: User, label: "Profile", href: "/profile", visible: ["admin", "teacher", "student", "parent"] },
      { icon: Settings, label: "Settings", href: "/settings", visible: ["admin", "teacher", "student", "parent"] },
      { icon: LogOut, label: "Logout", href: "#", visible: ["admin", "teacher", "student", "parent"] },
    ],
  },
];

export default function Menu() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user?.role as string) || "student";

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((section) => (
        <div className="flex flex-col gap-1" key={section.title}>
          <span className="hidden lg:block text-gray-400 font-medium text-xs uppercase tracking-wider my-3 px-2">
            {section.title}
          </span>
          {section.items.map((item) => {
            if (!item.visible.includes(role)) return null;

            // Logout button
            if (item.label === "Logout") {
              return (
                <button
                  key={item.label}
                  onClick={handleLogout}
                  className="flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors w-full"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="hidden lg:block font-medium">{item.label}</span>
                </button>
              );
            }

            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                href={item.href}
                key={item.label + item.href}
                className={`flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                <Icon className={`w-5 h-5 ${
                  isActive ? "text-blue-600" : "text-gray-400"
                }`} />
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}