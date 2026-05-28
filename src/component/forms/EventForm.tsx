"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import InputField from "@/component/InputField";
import { eventSchema, type EventFormData } from "@/lib/formValidation";

type Props = {
  mode: "create" | "update";
  data?: any;
  setOpen?: (open: boolean) => void;
};

export default function EventForm({ mode, data, setOpen }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: data?.title || "",
      date: data?.date || "",
      time: data?.time || "",
      location: data?.location || "",
      audience: data?.audience || "All",
      organizer: data?.organizer || "",
    },
  });

  const onSubmit = async (formData: EventFormData) => {
    try {
      console.log(mode === "create" ? "Creating event:" : "Updating event:", formData);
      await new Promise((r) => setTimeout(r, 500));

      toast.success(`Event ${mode === "create" ? "created" : "updated"} successfully!`);
      setOpen?.(false);
      router.push("/dashboard/admin/list/events");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  return (
    <form className="flex flex-col gap-8 max-w-3xl mx-auto" onSubmit={handleSubmit(onSubmit)}>
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
          defaultValue={data?.title}
          register={register}
          error={errors.title}
          placeholder="Annual Science Fair"
        />
        <InputField
          label="Date"
          name="date"
          type="date"
          defaultValue={data?.date}
          register={register}
          error={errors.date}
        />
        <InputField
          label="Time"
          name="time"
          defaultValue={data?.time}
          register={register}
          error={errors.time}
          placeholder="10:00 AM - 2:00 PM"
        />
        <InputField
          label="Location"
          name="location"
          defaultValue={data?.location}
          register={register}
          error={errors.location}
          placeholder="Main Hall"
        />
        <InputField
          label="Organizer"
          name="organizer"
          defaultValue={data?.organizer}
          register={register}
          error={errors.organizer}
          placeholder="Ms. Emily Davis"
        />

        {/* Audience */}
        <div className="flex flex-col gap-1 w-full md:w-[calc(50%-0.5rem)]">
          <label className="text-xs font-medium text-gray-500">Audience</label>
          <select
            {...register("audience")}
            defaultValue={data?.audience || "All"}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All</option>
            <option value="Teachers">Teachers</option>
            <option value="Students">Students</option>
            <option value="Parents">Parents</option>
            <option value="Staff">Staff</option>
          </select>
          {errors.audience && <p className="text-xs text-red-500">{errors.audience.message}</p>}
        </div>

        {data?.id && (
          <InputField label="Id" name="id" defaultValue={data?.id} register={register} hidden />
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full md:w-fit px-8 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
      >
        {isSubmitting ? "Saving..." : mode === "create" ? "Create Event" : "Update Event"}
      </button>
    </form>
  );
}