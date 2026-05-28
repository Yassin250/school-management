"use client";

import { useParams } from "next/navigation";
import ParentForm from "@/component/forms/ParentForm";
import { parentsData, studentsData } from "@/lib/mockData";

export default function EditParentPage() {
  const params = useParams();
  const id = params.id as string;

  const parent = parentsData.find((p) => p.id === id);

  if (!parent) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Parent not found</h1>
        <p className="text-sm text-gray-500 mt-1">No parent found with ID: {id}</p>
      </div>
    );
  }

  const relatedData = {
    students: studentsData.map((s) => ({ id: s.id, name: s.name })),
  };

  return (
    <div className="p-6">
      <ParentForm mode="update" data={parent} relatedData={relatedData} />
    </div>
  );
}