// src/app/dashboard/parent/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ParentDashboardClient from "./ParentDashboardClient";

export default async function ParentDashboardPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const parentId = session.user.id;

  // Fetch parent with their children
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
          grade: { select: { level: true } },
          attendances: {
            select: { present: true },
          },
          results: {
            select: { score: true },
          },
        },
      },
    },
  });

  if (!parent) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Parent not found</h1>
        <a href="/login" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          ← Back to Login
        </a>
      </div>
    );
  }

  // Format children data
  const children = parent.students.map((student) => {
    // Calculate attendance percentage
    const totalAttendance = student.attendances.length;
    const presentAttendance = student.attendances.filter((a) => a.present).length;
    const attendancePercent = totalAttendance > 0
      ? Math.round((presentAttendance / totalAttendance) * 100)
      : 0;

    // Calculate average grade
    const results = student.results;
    const avgGrade = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 0;

    return {
      id: student.id,
      name: `${student.name} ${student.surname}`,
      className: student.class?.name ?? "N/A",
      gradeLevel: student.grade?.level ?? 0,
      sex: student.sex,
      attendance: attendancePercent,
      avgGrade,
      studentId: student.id.slice(0, 8).toUpperCase(),
    };
  });

  return (
    <ParentDashboardClient
      parentName={`${parent.name} ${parent.surname}`}
      parentEmail={parent.email ?? ""}
      children={children}
    />
  );
}