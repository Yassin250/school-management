// src/component/forms/ExamForm.tsx
"use client";

import InputField from "@/component/InputField";
import { createExam, updateExam } from "@/lib/actions/exam";
import {
  examSchema,
  type ExamFormData,
} from "@/lib/formValidation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type RelatedData = {
  lessons: { id: number; name: string }[];
};

type Props = {
  mode: "create" | "update";
  data?: {
    id?: number;
    title?: string;
    startTime?: string;
    endTime?: string;
    lessonId?: number;
  };
  relatedData: RelatedData;
};

export default function ExamForm({ mode, data, relatedData }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema) as any,
    defaultValues: {
      id: data?.id,
      title: data?.title ?? "",
      startTime: data?.startTime ?? "",
      endTime: data?.endTime ?? "",
      lessonId: data?.lessonId ?? undefined,
    },
  });

  const onSubmit = async (formData: ExamFormData) => {
    if (!data?.id && mode === "update") {
      toast.error("Exam ID is missing");
      return;
    }

    setIsLoading(true);

    try {
      const result =
        mode === "create"
          ? await createExam(formData)
          : await updateExam(data!.id!, formData);

      if (result.success) {
        toast.success(
          `Exam ${mode === "create" ? "created" : "updated"} successfully`
        );
        router.push("/dashboard/admin/list/exams");
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const { lessons } = relatedData;
  const isSubmittingForm = isSubmitting || isLoading;

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold text-gray-900">
        {mode === "create" ? "Schedule a new exam" : "Update the exam"}
      </h1>

      {/* Exam Information */}
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        Exam Information
      </span>
      <div className="flex flex-wrap gap-4">
        <InputField
          label="Exam Title"
          name="title"
          register={register}
          error={errors.title}
          placeholder="e.g. Mid-Term Mathematics"
        />
      </div>

      {/* Schedule */}
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        Schedule
      </span>
      <div className="flex flex-wrap gap-4">
        <InputField
          label="Start Time"
          name="startTime"
          type="datetime-local"
          register={register}
          error={errors.startTime}
        />
        <InputField
          label="End Time"
          name="endTime"
          type="datetime-local"
          register={register}
          error={errors.endTime}
        />
      </div>

      {/* Lesson Assignment */}
      {lessons.length > 0 ? (
        <div className="space-y-2">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            Linked Lesson
          </span>
          <div className="flex flex-col gap-1 w-full md:w-[calc(50%-0.5rem)]">
            <select
              {...register("lessonId", { valueAsNumber: true })}
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Select a lesson</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.name}
                </option>
              ))}
            </select>
            {errors.lessonId && (
              <p className="text-xs text-red-500">{errors.lessonId.message}</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-amber-600">
          No lessons in the database. Create lessons before scheduling exams.
        </p>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmittingForm || (mode === "create" && lessons.length === 0)}
        className="w-full md:w-fit px-8 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {isSubmittingForm
          ? "Saving..."
          : mode === "create"
            ? "Schedule Exam"
            : "Update Exam"}
      </button>
    </form>
  );
}