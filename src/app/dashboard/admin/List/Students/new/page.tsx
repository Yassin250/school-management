// src/app/dashboard/admin/List/Students/new/page.tsx
import StudentForm from "@/component/forms/StudentForm";
import { getStudentRelatedData } from "@/lib/data/student";
import Link from "next/link";

export default async function NewStudentPage() {
  const relatedData = await getStudentRelatedData();

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link
        href="/dashboard/admin/list/students"
        className="text-sm text-blue-600 hover:underline w-fit"
      >
        ← Back to students
      </Link>
      <StudentForm mode="create" relatedData={relatedData} />
    </div>
  );
}