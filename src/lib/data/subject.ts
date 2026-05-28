// src/lib/data/subject.ts
import { prisma } from "@/lib/prisma";
import type { Subject, Teacher } from "@/generated/prisma/client";

export async function getSubjectRelatedData() {
  const teachers = await prisma.teacher.findMany({
    select: { id: true, name: true, surname: true },
    orderBy: { name: "asc" },
  });

  return {
    teachers: teachers.map((t) => ({
      id: String(t.id),
      name: `${t.name} ${t.surname}`,
    })),
  };
}

export function mapSubjectToFormData(
  subject: Subject & { teachers: Teacher[] }
) {
  return {
    id: subject.id,
    name: subject.name,
    teachers: subject.teachers.map((t) => String(t.id)),
  };
}

export type SubjectFormInitialData = ReturnType<typeof mapSubjectToFormData>;