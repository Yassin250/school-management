// src/lib/data/student.ts
import { prisma } from "@/lib/prisma";
import type { Class, Grade, Parent, Student } from "@/generated/prisma/client";

export async function getStudentRelatedData() {
  const [classes, grades, parents] = await Promise.all([
    prisma.class.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.grade.findMany({
      select: { id: true, level: true },
      orderBy: { level: "asc" },
    }),
    prisma.parent.findMany({
      select: { id: true, name: true, surname: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    classes: classes.map((c) => ({ id: String(c.id), name: c.name })),
    grades: grades.map((g) => ({ id: String(g.id), level: g.level })),
    parents: parents.map((p) => ({ 
      id: String(p.id), 
      name: `${p.name} ${p.surname}` 
    })),
  };
}

export function mapStudentToFormData(
  student: Student & { class: Class; grade: Grade; parent: Parent }
) {
  return {
    id: student.id,
    username: student.username,
    name: student.name,
    surname: student.surname,
    email: student.email ?? "",
    phone: student.phone ?? "",
    address: student.address,
    sex: student.sex,
    birthday: student.birthday.toISOString().split("T")[0],
    img: student.img ?? "",
    classId: String(student.classId),
    gradeId: String(student.gradeId),
    parentId: String(student.parentId),
  };
}

export type StudentFormInitialData = ReturnType<typeof mapStudentToFormData>;