// src/app/dashboard/admin/List/Students/page.tsx
import { prisma } from "@/lib/prisma";
import StudentsListClient from "./StudentsListClient";

export default async function StudentsListPage() {
  const students = await prisma.student.findMany({
    include: {
      class: true,
      grade: true,
      parent: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Calculate attendance percentage for each student
  const studentsWithAttendance = await Promise.all(
    students.map(async (student) => {
      const totalAttendance = await prisma.attendance.count({
        where: { studentId: student.id },
      });
      
      const presentAttendance = await prisma.attendance.count({
        where: { 
          studentId: student.id,
          present: true,
        },
      });

      // Return ONLY the fields that match the Student type
      return {
        id: student.id,
        name: `${student.name} ${student.surname}`,
        email: student.email || "",
        studentId: student.username,
        class: student.class?.name || "Unassigned",
        parent: student.parent 
          ? `${student.parent.name} ${student.parent.surname}` 
          : "No parent",
        gender: (student.sex === "MALE" ? "Male" : "Female") as "Male" | "Female",
        attendance: totalAttendance > 0 
          ? Math.round((presentAttendance / totalAttendance) * 100) 
          : 0,
      };
    })
  );

  return <StudentsListClient data={studentsWithAttendance} />;
}