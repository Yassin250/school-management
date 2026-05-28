import { prisma } from "@/lib/prisma";
import type { Class, Subject, Teacher } from "@/generated/prisma/client";

export async function getTeacherRelatedData() {
  const [subjects, classes] = await Promise.all([
    prisma.subject.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.class.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    subjects: subjects.map((s) => ({ id: String(s.id), name: s.name })),
    classes: classes.map((c) => ({ id: String(c.id), name: c.name })),
  };
}

export function mapTeacherToFormData(
  teacher: Teacher & { subjects: Subject[]; supervisedClasses: Class[] }
) {
  return {
    id: teacher.id,
    username: teacher.username,
    name: teacher.name,
    surname: teacher.surname,
    email: teacher.email ?? "",
    phone: teacher.phone ?? "",
    address: teacher.address,
    sex: teacher.sex,
    birthday: teacher.birthday.toISOString().split("T")[0],
    img: teacher.img ?? "",
    subjects: teacher.subjects.map((s) => String(s.id)),
    classes: teacher.supervisedClasses.map((c) => String(c.id)),
  };
}

export type TeacherFormInitialData = ReturnType<typeof mapTeacherToFormData>;
