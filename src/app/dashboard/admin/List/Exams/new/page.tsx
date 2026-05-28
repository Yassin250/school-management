// src/app/dashboard/admin/List/Exams/new/page.tsx
import ExamForm from "@/component/forms/ExamForm";
import { getExamRelatedData } from "@/lib/data/exam";
import Link from "next/link";

export default async function NewExamPage() {
  const relatedData = await getExamRelatedData();

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link
        href="/dashboard/admin/list/exams"
        className="text-sm text-blue-600 hover:underline w-fit"
      >
        ← Back to exams
      </Link>
      <ExamForm mode="create" relatedData={relatedData} />
    </div>
  );
}