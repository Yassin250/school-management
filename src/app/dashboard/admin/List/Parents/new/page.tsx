"use client";

import ParentForm from "@/component/forms/ParentForm";

export default function NewParentPage() {
  return (
    <div className="p-6">
      <ParentForm mode="create" />
    </div>
  );
}