"use client";

import { useParams } from "next/navigation";
import ClassForm from "@/component/forms/ClassForm";
import { classesData, teachersData } from "@/lib/mockData";

export default function EditClassPage() {
  const params = useParams();
  const id = params.id as string;

  const classItem = classesData.find((c) => c.id === id);

  if (!classItem) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Class not found</h1>
        <p className="text-sm text-gray-500 mt-1">No class found with ID: {id}</p>
      </div>
    );
  }

  const relatedData = {
    teachers: teachersData.map((t) => ({ id: t.id, name: t.name })),
  };

  return (
    <div className="p-6">
      <ClassForm mode="update" data={classItem} relatedData={relatedData} />
    </div>
  );
}