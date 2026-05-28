"use client";

import ClassForm from "@/component/forms/ClassForm";

export default function NewClassPage() {
  return (
    <div className="p-6">
      <ClassForm mode="create" />
    </div>
  );
}