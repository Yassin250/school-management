// src/app/dashboard/student/page.tsx
import { auth } from "@/auth";
import Announcements from "@/component/Announcements";
import DashboardTimetableContainer from "@/component/DashboardTimetableContainer";
import EventCalendar from "@/component/EventCalendar";
import { prisma } from "@/lib/prisma";
import { BookOpen, Clock, Calendar } from "lucide-react";

export default async function StudentPage({
  searchParams,
}: {
  searchParams: Promise<{ termId?: string; [key: string]: string | undefined }>;
}) {
  const session = await auth();
  const studentId = session?.user?.id;

  if (!studentId) {
    return (
      <div className="p-6 text-center text-red-650 font-semibold">
        Not authenticated. Please log in.
      </div>
    );
  }

  const { termId } = await searchParams;

  // Query actual student data
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: true,
      grade: true,
    },
  });

  if (!student) {
    return (
      <div className="p-6 text-center text-slate-500 font-semibold">
        Student profile not found.
      </div>
    );
  }

  const className = student.class.name;

  // Calculate actual stats from the database
  const subjectsCount = await prisma.subject.count({
    where: {
      lessons: {
        some: {
          classId: student.classId,
        },
      },
    },
  });

  const totalAttendances = await prisma.attendance.count({
    where: { studentId },
  });
  const presentAttendances = await prisma.attendance.count({
    where: { studentId, present: true },
  });
  const attendancePercentage = totalAttendances > 0 
    ? Math.round((presentAttendances / totalAttendances) * 100) 
    : 100;

  const eventsCount = await prisma.event.count({
    where: {
      OR: [
        { classId: null },
        { classId: student.classId },
      ],
    },
  });

  const stats = [
    { icon: BookOpen, label: "Subjects", value: String(subjectsCount), color: "bg-blue-50 text-blue-600" },
    { icon: Clock, label: "Attendance", value: `${attendancePercentage}%`, color: "bg-green-50 text-green-600" },
    { icon: Calendar, label: "Events", value: String(eventsCount), color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-6">
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Welcome back, {student.name}!</h2>
              <p className="text-sm text-gray-500 mt-1">
                Class {className} • Grade {student.grade.level} • Academic Term Schedule
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className={`rounded-xl p-4 ${stat.color} bg-opacity-10`}>
                  <Icon className="w-5 h-5 mb-2 opacity-70" />
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs opacity-70">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timetable */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-blue-600 rounded-full" />
              <h1 className="text-lg font-semibold text-gray-900">
                Schedule (Class {className})
              </h1>
            </div>
            <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
              Weekly Period Grid
            </span>
          </div>
          <DashboardTimetableContainer type="classId" id={String(student.classId)} searchParams={{ termId }} />
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-6">
        <EventCalendar />
        <Announcements />
      </div>
    </div>
  );
}