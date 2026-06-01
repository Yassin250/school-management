// src/app/dashboard/parent/attendance/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ParentAttendanceClient from "./ParentAttendanceClient";

export default async function ParentAttendancePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parentId = session.user.id;

  // Fetch parent with children and their attendance
  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    include: {
      students: {
        select: {
          id: true,
          name: true,
          surname: true,
          sex: true,
          class: { select: { name: true } },
          attendances: {
            orderBy: { date: "desc" },
            take: 60,
            include: {
              lesson: {
                select: {
                  name: true,
                  subject: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!parent) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Parent not found</h1>
      </div>
    );
  }

  // Format children with attendance data
  const children = parent.students.map((student) => {
    const totalDays = student.attendances.length;
    const presentDays = student.attendances.filter((a) => a.present).length;
    const absentDays = totalDays - presentDays;
    const attendanceRate = totalDays > 0
      ? Math.round((presentDays / totalDays) * 100)
      : 0;

    // Group attendance by month
    const monthlyAttendance: Record<string, { present: number; total: number }> = {};
    student.attendances.forEach((a) => {
      const month = a.date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      if (!monthlyAttendance[month]) {
        monthlyAttendance[month] = { present: 0, total: 0 };
      }
      monthlyAttendance[month].total++;
      if (a.present) monthlyAttendance[month].present++;
    });

    // Recent attendance records
    const recentAttendance = student.attendances.slice(0, 20).map((a) => ({
      id: a.id,
      date: a.date.toISOString().split("T")[0],
      day: a.date.toLocaleDateString("en-US", { weekday: "short" }),
      present: a.present,
      subject: a.lesson?.subject?.name ?? "N/A",
      lesson: a.lesson?.name ?? "N/A",
    }));

    return {
      id: student.id,
      name: `${student.name} ${student.surname}`,
      className: student.class?.name ?? "N/A",
      sex: student.sex,
      totalDays,
      presentDays,
      absentDays,
      attendanceRate,
      monthlyAttendance: Object.entries(monthlyAttendance).map(([month, data]) => ({
        month,
        rate: Math.round((data.present / data.total) * 100),
      })),
      recentAttendance,
    };
  });

  return (
    <ParentAttendanceClient
      parentName={`${parent.name} ${parent.surname}`}
      children={children}
    />
  );
}