// src/component/forms/EventForm.tsx
"use client";

import InputField from "@/component/InputField";
import { createEvent, updateEvent } from "@/lib/actions/event";
import {
  eventSchema,
  type EventFormData,
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
    startTime?: string;
    endTime?: string;
    classId?: number | string;
  };
  relatedData: RelatedData;
};

export default function EventForm({ mode, data, relatedData }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema) as any,
    defaultValues: {
      id: data?.id,
      title: data?.title ?? "",
      description: data?.description ?? "",
      startTime: data?.startTime ?? "",
      endTime: data?.endTime ?? "",
      classId: data?.classId ? Number(data.classId) : "",
    },
  });

  const onSubmit = async (formData: EventFormData) => {
    if (!data?.id && mode === "update") {
      toast.error("Event ID is missing");
      return;
    }

    setIsLoading(true);

    try {
      const result =
        mode === "create"
          ? await createEvent(formData)
          : await updateEvent(data!.id!, formData);

      if (result.success) {
        toast.success(
          `Event ${mode === "create" ? "created" : "updated"} successfully`
        );
        router.push("/dashboard/admin/list/events");
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
        {mode === "create" ? "Create a new event" : "Update the event"}
      </h1>

      {/* Event Information */}
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        Event Information
      </span>
      <div className="flex flex-wrap gap-4">
        <InputField
          label="Event Title"
          name="title"
          register={register}
          error={errors.title}
          placeholder="e.g. Science Fair"
        />
        <div className="flex flex-col gap-1 w-full">
          <label className="text-xs font-medium text-gray-500">Description</label>
          <textarea
            {...register("description")}
            rows={3}
            className="p-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            placeholder="Describe the event..."
          />
          {errors.description && (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>
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

      {/* Class Assignment */}
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        Audience
      </span>
      <div className="flex flex-col gap-1 w-full md:w-[calc(50%-0.5rem)]">
        <select
          {...register("classId")}
          className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
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
        <p className="text-xs text-gray-400">Leave empty for all-school events</p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmittingForm}
        className="w-full md:w-fit px-8 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {isSubmittingForm
          ? "Saving..."
          : mode === "create"
            ? "Create Event"
            : "Update Event"}
      </button>
    </form>
  );
}