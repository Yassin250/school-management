// src/app/dashboard/admin/List/Parents/new/page.tsx
import ParentForm from "@/component/forms/ParentForm";
import Link from "next/link";

export default function NewParentPage() {
  return (
    <div className="p-6 flex flex-col gap-4">
      <Link
        href="/dashboard/admin/list/parents"
        className="text-sm text-blue-600 hover:underline w-fit"
      >
        ← Back to parents
      </Link>
      <ParentForm mode="create" />
    </div>
  );
}