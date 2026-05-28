// src/app/dashboard/admin/List/Parents/[id]/edit/page.tsx
import ParentForm from "@/component/forms/ParentForm";
import { mapParentToFormData } from "@/lib/data/parent";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditParentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const parent = await prisma.parent.findUnique({
    where: { id },
    include: {
      students: true,
    },
  });

  if (!parent) {
    notFound();
  }

  const formData = mapParentToFormData(parent);

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link
        href="/dashboard/admin/list/parents"
        className="text-sm text-blue-600 hover:underline w-fit"
      >
        ← Back to parents
      </Link>
      <ParentForm mode="update" data={formData} />
    </div>
  );
}