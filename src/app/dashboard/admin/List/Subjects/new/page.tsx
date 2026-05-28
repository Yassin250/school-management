// src/app/dashboard/admin/List/Subjects/new/page.tsx
import SubjectForm from "@/component/forms/SubjectForm";
import { getSubjectRelatedData } from "@/lib/data/subject";
import Link from "next/link";

export default async function NewSubjectPage() {
  const relatedData = await getSubjectRelatedData();

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link
        href="/dashboard/admin/list/subjects"
        className="text-sm text-blue-600 hover:underline w-fit"
      >
        ← Back to subjects
      </Link>
      <SubjectForm mode="create" relatedData={relatedData} />
    </div>
  );
}