// src/component/forms/SubjectForm.tsx
"use client";

import InputField from "@/component/InputField";
import { createSubject, updateSubject } from "@/lib/actions/subject";
import {
  subjectSchema,
  type SubjectFormData,
} from "@/lib/formValidation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

type RelatedData = {
  teachers: { id: string; name: string }[];
};

type Props = {
  mode: "create" | "update";
  data?: {
    id?: number;
    name?: string;
    teachers?: string[];
  };
  relatedData: RelatedData;
};

export default function SubjectForm({ mode, data, relatedData }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      id: data?.id,
      name: data?.name ?? "",
      teachers: data?.teachers ?? [],
    },
  });

  const onSubmit = async (formData: SubjectFormData) => {
    if (!data?.id && mode === "update") {
      toast.error("Subject ID is missing");
      return;
    }

    setIsLoading(true);

    try {
      const result =
        mode === "create"
          ? await createSubject(formData)
          : await updateSubject(data!.id!, formData);

      if (result.success) {
        toast.success(
          `Subject ${mode === "create" ? "created" : "updated"} successfully`
        );
        router.push("/dashboard/admin/list/subjects");
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

  const { teachers } = relatedData;
  const isSubmittingForm = isSubmitting || isLoading;

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold text-gray-900">
        {mode === "create" ? "Create a new subject" : "Update the subject"}
      </h1>

      {/* Subject Information */}
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        Subject Information
      </span>
      <div className="flex flex-wrap gap-4">
        <InputField
          label="Subject Name"
          name="name"
          register={register}
          error={errors.name}
          placeholder="e.g. Mathematics"
        />
      </div>

      {/* Teachers Assignment */}
      {teachers.length > 0 ? (
        <div className="space-y-2">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            Assigned Teachers
          </span>
          <Controller
            name="teachers"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-1 w-full">
                <select
                  multiple
                  value={field.value ?? []}
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (o) => o.value
                    );
                    field.onChange(selected);
                  }}
                  className="min-h-[150px] p-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
                {errors.teachers && (
                  <p className="text-xs text-red-500">{errors.teachers.message}</p>
                )}
                <p className="text-xs text-gray-400">
                  Hold Ctrl/Cmd to select multiple teachers
                </p>
              </div>
            )}
          />
        </div>
      ) : (
        <p className="text-sm text-amber-600">
          No teachers in the database. Add teachers before creating subjects.
        </p>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmittingForm || (mode === "create" && teachers.length === 0)}
        className="w-full md:w-fit px-8 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {isSubmittingForm
          ? "Saving..."
          : mode === "create"
            ? "Create Subject"
            : "Update Subject"}
      </button>
    </form>
  );
}