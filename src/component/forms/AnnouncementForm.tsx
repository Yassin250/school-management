"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import InputField from "@/component/InputField";
import { announcementSchema, type AnnouncementFormData } from "@/lib/formValidation";

type Props = {
  mode: "create" | "update";
  data?: any;
  setOpen?: (open: boolean) => void;
};

export default function AnnouncementForm({ mode, data, setOpen }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: data?.title || "",
      description: data?.description || "",
      date: data?.date || new Date().toISOString().split("T")[0],
      audience: data?.audience || "All",
      author: data?.author || "",
      pinned: data?.pinned || false,
      priority: data?.priority || "Medium",
    },
  });

  const onSubmit = async (formData: AnnouncementFormData) => {
    try {
      console.log(mode === "create" ? "Creating announcement:" : "Updating announcement:", formData);
      await new Promise((r) => setTimeout(r, 500));

      toast.success(`Announcement ${mode === "create" ? "created" : "updated"} successfully!`);
      setOpen?.(false);
      router.push("/dashboard/admin/list/announcements");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  return (
    <form className="flex flex-col gap-8 max-w-3xl mx-auto" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold text-gray-900">
        {mode === "create" ? "Create a new announcement" : "Update the announcement"}
      </h1>

      {/* Announcement Information */}
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        Announcement Information
      </span>
      <div className="flex flex-wrap gap-4">
        <InputField
          label="Title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors.title}
          placeholder="Staff Meeting Tomorrow"
        />

        {/* Description */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-xs font-medium text-gray-500">Description</label>
          <textarea
            {...register("description")}
            defaultValue={data?.description || ""}
            rows={4}
            placeholder="Enter announcement details..."
            className={`p-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description ? "border-red-300" : "border-gray-200"
            }`}
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <InputField
          label="Date"
          name="date"
          type="date"
          defaultValue={data?.date || new Date().toISOString().split("T")[0]}
          register={register}
          error={errors.date}
        />
        <InputField
          label="Author"
          name="author"
          defaultValue={data?.author}
          register={register}
          error={errors.author}
          placeholder="Principal Office"
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
          </select>
          {errors.audience && <p className="text-xs text-red-500">{errors.audience.message}</p>}
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1 w-full md:w-[calc(50%-0.5rem)]">
          <label className="text-xs font-medium text-gray-500">Priority</label>
          <select
            {...register("priority")}
            defaultValue={data?.priority || "Medium"}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          {errors.priority && <p className="text-xs text-red-500">{errors.priority.message}</p>}
        </div>

        {/* Pinned Checkbox */}
        <div className="flex items-center gap-2 w-full">
          <input
            type="checkbox"
            id="pinned"
            {...register("pinned")}
            defaultChecked={data?.pinned || false}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="pinned" className="text-sm text-gray-700">Pin this announcement</label>
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
        {isSubmitting ? "Saving..." : mode === "create" ? "Create Announcement" : "Update Announcement"}
      </button>
    </form>
  );
}