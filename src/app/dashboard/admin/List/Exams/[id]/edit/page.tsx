"use client";

import { useParams } from "next/navigation";
import ExamForm from "@/component/forms/ExamForm";
import { examsData, classesData } from "@/lib/mockData";

export default function EditExamPage() {
  const params = useParams();
  const id = params.id as string;

  const exam = examsData.find((e) => e.id === id);

  if (!exam) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Exam not found</h1>
        <p className="text-sm text-gray-500 mt-1">No exam found with ID: {id}</p>
      </div>
    );
  }

  const relatedData = {
    classes: classesData.map((c) => ({ id: c.id, name: c.name })),
  };

  return (
    <div className="p-6">
      <ExamForm mode="update" data={exam} relatedData={relatedData} />
    </div>
  );
}