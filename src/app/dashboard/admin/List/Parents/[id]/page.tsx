// src/app/dashboard/admin/List/Parents/[id]/page.tsx
import ParentDetailView from "./ParentDetailView";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ParentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const parent = await prisma.parent.findUnique({
    where: { id },
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
  });

  if (!parent) {
    notFound();
  }

  return (
    <ParentDetailView
      parent={{
        id: parent.id,
        name: `${parent.name} ${parent.surname}`,
        username: parent.username,
        email: parent.email ?? "",
        phone: parent.phone,
        address: parent.address,
        childrenCount: parent.students.length,
        children: parent.students.map((s) => ({
          id: s.id,
          name: `${s.name} ${s.surname}`,
          class: s.class?.name ?? "Unassigned",
        })),
        createdAt: parent.createdAt.toISOString(),
      }}
    />
  );
}