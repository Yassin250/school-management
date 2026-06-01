// src/app/dashboard/admin/List/Students/[id]/page.tsx
import StudentDetailView from "./StudentDetailView";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      class: true,
      grade: true,
      parent: true,
      results: {
        take: 10,
        orderBy: {
          score: "desc",
        },
        include: {
          exam: {
            select: { title: true },
          },
          assignment: {
            select: { title: true },
          },
        },
      },
      attendances: {  // ✅ Changed from 'attendance' to 'attendances'
        select: { present: true },
      },
    },
  });

  if (!student) {
    notFound();
  }

  // Calculate attendance percentage
  const totalAttendance = student.attendances.length;
  const presentAttendance = student.attendances.filter((a) => a.present).length;
  const attendancePercentage =
    totalAttendance > 0
      ? Math.round((presentAttendance / totalAttendance) * 100)
      : 0;

  // Format recent results
  const recentResults = student.results.map((result) => ({
    id: String(result.id),
    score: result.score,
    examTitle: result.exam?.title ?? undefined,
    assignmentTitle: result.assignment?.title ?? undefined,
  }));

  return (
    <StudentDetailView
      student={{
        id: student.id,
        name: `${student.name} ${student.surname}`,
        username: student.username,
        email: student.email ?? "",
        phone: student.phone ?? "",
        address: student.address,
        sex: student.sex,
        birthday: student.birthday.toISOString(),
        img: student.img,
        class: student.class?.name ?? "Unassigned",
        gradeLevel: student.grade?.level ?? 0,
        parent: student.parent?.id ?? "",
        parentName: student.parent
          ? `${student.parent.name} ${student.parent.surname}`
          : "No parent assigned",
        attendance: attendancePercentage,
        recentResults,
        createdAt: new Date().toISOString(),
      }}
    />
  );
}