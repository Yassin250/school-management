"use client";

import SubjectForm from "@/component/forms/SubjectForm";

export default function NewSubjectPage() {
  return (
    <div className="p-6">
      <SubjectForm mode="create" />
    </div>
  );
}