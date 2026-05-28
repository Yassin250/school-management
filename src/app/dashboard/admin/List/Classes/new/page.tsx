// src/app/dashboard/admin/List/Classes/new/page.tsx
import ClassForm from "@/component/forms/ClassForm";
import { getClassRelatedData } from "@/lib/data/class";
import Link from "next/link";

export default async function NewClassPage() {
  const relatedData = await getClassRelatedData();

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link
        href="/dashboard/admin/list/classes"
        className="text-sm text-blue-600 hover:underline w-fit"
      >
        ← Back to classes
      </Link>
      <ClassForm mode="create" relatedData={relatedData} />
    </div>
  );
}