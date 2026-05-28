"use client";

import { useParams } from "next/navigation";
import SubjectForm from "@/component/forms/SubjectForm";
import { subjectsData, teachersData, classesData } from "@/lib/mockData";

export default function EditSubjectPage() {
  const params = useParams();
  const id = params.id as string;

  const subject = subjectsData.find((s) => s.id === id);

  if (!subject) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Subject not found</h1>
        <p className="text-sm text-gray-500 mt-1">No subject found with ID: {id}</p>
      </div>
    );
  }

  const relatedData = {
    teachers: teachersData.map((t) => ({ id: t.id, name: t.name })),
    classes: classesData.map((c) => ({ id: c.id, name: c.name })),
  };

  return (
    <div className="p-6">
      <SubjectForm mode="update" data={subject} relatedData={relatedData} />
    </div>
  );
}