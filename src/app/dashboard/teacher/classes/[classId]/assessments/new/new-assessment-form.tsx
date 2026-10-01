"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAssessmentAction } from "../actions";
import type { TeacherSubjectOption } from "@/lib/services/teacher/assessments";

const ASSESSMENT_TYPES = [
  { value: "QUIZ", label: "Quiz" },
  { value: "ASSIGNMENT", label: "Assignment" },
  { value: "TEST", label: "Test" },
  { value: "MID_TERM", label: "Mid-Term" },
  { value: "FINAL_EXAM", label: "Final Exam" },
  { value: "PROJECT", label: "Project" },
  { value: "PRACTICAL", label: "Practical" },
];

interface Props {
  classId: string;
  subjects: TeacherSubjectOption[];
}

export function NewAssessmentForm({ classId, subjects }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createAssessmentAction(classId, formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Success - navigate back to the class page
      router.push(`/dashboard/teacher/classes/${classId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-neutral-700"
        >
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          placeholder="e.g., Quiz 1 - Fractions"
        />
      </div>

      <div>
        <label
          htmlFor="type"
          className="block text-sm font-medium text-neutral-700"
        >
          Assessment Type
        </label>
        <select
          id="type"
          name="type"
          required
          defaultValue="QUIZ"
          className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        >
          {ASSESSMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="subjectId"
          className="block text-sm font-medium text-neutral-700"
        >
          Subject
        </label>
        <select
          id="subjectId"
          name="subjectId"
          required
          className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        >
          {subjects.map((s) => {
            const value = s.subjectId
              ? `subject:${s.subjectId}`
              : `module:${s.moduleId}`;
            return (
              <option key={value} value={value}>
                {s.label}
              </option>
            );
          })}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="maxScore"
            className="block text-sm font-medium text-neutral-700"
          >
            Max Score
          </label>
          <input
            id="maxScore"
            name="maxScore"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue="100"
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>

        <div>
          <label
            htmlFor="weight"
            className="block text-sm font-medium text-neutral-700"
          >
            Weight (%)
          </label>
          <input
            id="weight"
            name="weight"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="Optional"
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="assessmentDate"
          className="block text-sm font-medium text-neutral-700"
        >
          Assessment Date
        </label>
        <input
          id="assessmentDate"
          name="assessmentDate"
          type="date"
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href={`/dashboard/teacher/classes/${classId}`}
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create Assessment"}
        </button>
      </div>
    </form>
  );
}