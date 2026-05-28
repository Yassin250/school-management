// src/component/forms/ClassForm.tsx
"use client";

import InputField from "@/component/InputField";
import { createClass, updateClass } from "@/lib/actions/class";
import {
  classSchema,
  type ClassFormData,
} from "@/lib/formValidation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type RelatedData = {
  grades: { id: string; level: number }[];
  teachers: { id: string; name: string }[];
};

type Props = {
  mode: "create" | "update";
  data?: {
    id?: number;
    name?: string;
    capacity?: number;
    gradeId?: string;
    supervisorId?: string;
  };
  relatedData: RelatedData;
};

export default function ClassForm({ mode, data, relatedData }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      id: data?.id,
      name: data?.name ?? "",
      capacity: data?.capacity ?? 30,
      gradeId: data?.gradeId ?? "",
      supervisorId: data?.supervisorId ?? "",
    },
  });

  const onSubmit = async (formData: ClassFormData) => {
    if (!data?.id && mode === "update") {
      toast.error("Class ID is missing");
      return;
    }

    setIsLoading(true);

    try {
      const result =
        mode === "create"
          ? await createClass(formData)
          : await updateClass(data!.id!, formData);

      if (result.success) {
        toast.success(
          `Class ${mode === "create" ? "created" : "updated"} successfully`
        );
        router.push("/dashboard/admin/list/classes");
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

  const { grades, teachers } = relatedData;
  const isSubmittingForm = isSubmitting || isLoading;

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold text-gray-900">
        {mode === "create" ? "Create a new class" : "Update the class"}
      </h1>

      {/* Class Information */}
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        Class Information
      </span>
      <div className="flex flex-wrap gap-4">
        <InputField
          label="Class Name"
          name="name"
          register={register}
          error={errors.name}
          placeholder="e.g. 4A"
        />
        <InputField
          label="Capacity"
          name="capacity"
          type="number"
          register={register}
          error={errors.capacity}
          placeholder="30"
        />
      </div>

      {/* Academic Settings */}
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        Academic Settings
      </span>
      <div className="flex flex-wrap gap-4">
        {/* Grade Selection */}
        {grades.length > 0 ? (
          <div className="flex flex-col gap-1 w-full md:w-[calc(50%-0.5rem)]">
            <label className="text-xs font-medium text-gray-500">Grade Level</label>
            <select
              {...register("gradeId")}
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a grade</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  Grade {grade.level}
                </option>
              ))}
            </select>
            {errors.gradeId && (
              <p className="text-xs text-red-500">{errors.gradeId.message}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-amber-600 w-full">
            No grades in the database. Add grades before creating classes.
          </p>
        )}

        {/* Supervisor Selection */}
        {teachers.length > 0 ? (
          <div className="flex flex-col gap-1 w-full md:w-[calc(50%-0.5rem)]">
            <label className="text-xs font-medium text-gray-500">
              Class Supervisor (optional)
            </label>
            <select
              {...register("supervisorId")}
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">No supervisor</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
            {errors.supervisorId && (
              <p className="text-xs text-red-500">{errors.supervisorId.message}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-amber-600 w-full">
            No teachers available. Add teachers first to assign a supervisor.
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmittingForm || (mode === "create" && grades.length === 0)}
        className="w-full md:w-fit px-8 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {isSubmittingForm
          ? "Saving..."
          : mode === "create"
            ? "Create Class"
            : "Update Class"}
      </button>
    </form>
  );
}