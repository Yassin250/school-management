// src/app/dashboard/admin/List/Parents/page.tsx
import { prisma } from "@/lib/prisma";
import ParentsListClient from "./ParentListClient";

export default async function ParentsListPage() {
  const parents = await prisma.parent.findMany({
    include: {
      students: {
        select: {
          id: true,
          name: true,
          surname: true,
          class: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const formattedParents = parents.map((parent) => ({
    id: parent.id,
    name: `${parent.name} ${parent.surname}`,
    email: parent.email || "",
    phone: parent.phone,
    address: parent.address,
    childrenCount: parent.students.length,
    childrenNames: parent.students.map(
      (s) => `${s.name} ${s.surname} (${s.class?.name || "N/A"})`
    ),
  }));

  return <ParentsListClient data={formattedParents} />;
}