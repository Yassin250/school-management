import TeacherForm from "@/component/forms/TeacherForm";
import Link from "next/link";
import { getTeacherRelatedData } from "@/lib/data/teacher";

export default async function NewTeacherPage() {
  const relatedData = await getTeacherRelatedData();

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link
        href="/dashboard/admin/list/teachers"
        className="text-sm text-blue-600 hover:underline w-fit"
      >
        ← Back to teachers
      </Link>
      <TeacherForm mode="create" relatedData={relatedData} />
    </div>
  );
}
