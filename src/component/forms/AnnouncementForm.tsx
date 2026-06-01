// src/component/forms/AnnouncementForm.tsx
"use client";

import InputField from "@/component/InputField";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions/announcement";
import {
  announcementSchema,
  type AnnouncementFormData,
} from "@/lib/formValidation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type RelatedData = {
  classes: { id: number; name: string }[];
};

type Props = {
  mode: "create" | "update";
  data?: {
    id?: number;
    title?: string;
    description?: string;
    date?: string;
    classId?: number | string;
  };
  relatedData: RelatedData;
};

export default function AnnouncementForm({ mode, data, relatedData }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema) as any,
    defaultValues: {
      id: data?.id,
      title: data?.title ?? "",
      description: data?.description ?? "",
      date: data?.date ?? new Date().toISOString().split("T")[0],
      classId: data?.classId ? Number(data.classId) : "",
    },
  });

  const onSubmit = async (formData: AnnouncementFormData) => {
    if (!data?.id && mode === "update") {
      toast.error("Announcement ID is missing");
      return;
    }

    setIsLoading(true);

    try {
      const result =
        mode === "create"
          ? await createAnnouncement(formData)
          : await updateAnnouncement(data!.id!, formData);

      if (result.success) {
        toast.success(
          `Announcement ${mode === "create" ? "posted" : "updated"} successfully`
        );
        router.push("/dashboard/admin/list/announcements");
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

  const { classes } = relatedData;
  const isSubmittingForm = isSubmitting || isLoading;

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold text-gray-900">
        {mode === "create" ? "Post a new announcement" : "Update the announcement"}
      </h1>

      {/* Announcement Content */}
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        Content
      </span>
      <div className="flex flex-wrap gap-4">
        <InputField
          label="Title"
          name="title"
          register={register}
          error={errors.title}
          placeholder="e.g. Mid-Term Exam Schedule"
        />
        <div className="flex flex-col gap-1 w-full">
          <label className="text-xs font-medium text-gray-500">Description</label>
          <textarea
            {...register("description")}
            rows={4}
            className="p-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            placeholder="Write your announcement details..."
          />
          {errors.description && (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Settings */}
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        Settings
      </span>
      <div className="flex flex-wrap gap-4">
        <InputField
          label="Date"
          name="date"
          type="date"
          register={register}
          error={errors.date}
        />

        <div className="flex flex-col gap-1 w-full md:w-[calc(50%-0.5rem)]">
          <label className="text-xs font-medium text-gray-500">Audience</label>
          <select
            {...register("classId")}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All School</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          {errors.classId && (
            <p className="text-xs text-red-500">{errors.classId.message}</p>
          )}
          <p className="text-xs text-gray-400">Leave empty for all-school announcements</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmittingForm}
        className="w-full md:w-fit px-8 py-2.5 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {isSubmittingForm
          ? "Posting..."
          : mode === "create"
            ? "Post Announcement"
            : "Update Announcement"}
      </button>
    </form>
  );
}