// src/lib/data/class.ts
import { prisma } from "@/lib/prisma";

export async function getClassRelatedData() {
  const [grades, teachers] = await Promise.all([
    prisma.grade.findMany({
      select: { id: true, level: true },
      orderBy: { level: "asc" },
    }),
    prisma.teacher.findMany({
      select: { id: true, name: true, surname: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    grades: grades.map((g) => ({ id: String(g.id), level: g.level })),
    teachers: teachers.map((t) => ({
      id: t.id,
      name: `${t.name} ${t.surname}`,
    })),
  };
}

export function mapClassToFormData(
  classItem: {
    id: number;
    name: string;
    capacity: number;
    gradeId: number;
    supervisorId: string | null;
  }
) {
  return {
    id: classItem.id,
    name: classItem.name,
    capacity: classItem.capacity,
    gradeId: String(classItem.gradeId),
    supervisorId: classItem.supervisorId ?? "",
  };
}

export type ClassFormInitialData = ReturnType<typeof mapClassToFormData>;