"use client";

import ExamForm from "@/component/forms/ExamForm";

export default function NewExamPage() {
  return (
    <div className="p-6">
      <ExamForm mode="create" />
    </div>
  );
}