"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import InputField from "@/component/InputField";
import { classSchema, type ClassFormData } from "@/lib/formValidation";

type Props = {
  mode: "create" | "update";
  data?: any;
  setOpen?: (open: boolean) => void;
  relatedData?: {
    teachers: { id: string; name: string }[];
  };
};

export default function ClassForm({ mode, data, setOpen, relatedData }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: data?.name || "",
      section: data?.section || "",
      capacity: data?.capacity || 20,
      grade: data?.grade || 1,
      supervisor: data?.supervisor || "",
    },
  });

  const onSubmit = async (formData: ClassFormData) => {
    try {
      console.log(mode === "create" ? "Creating class:" : "Updating class:", formData);
      await new Promise((r) => setTimeout(r, 500));

      toast.success(`Class ${mode === "create" ? "created" : "updated"} successfully!`);
      setOpen?.(false);
      router.push("/dashboard/admin/list/classes");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  const teachers = relatedData?.teachers || [];

  return (
    <form className="flex flex-col gap-8 max-w-3xl mx-auto" onSubmit={handleSubmit(onSubmit)}>
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
          defaultValue={data?.name}
          register={register}
          error={errors.name}
          placeholder="5A"
        />
        <InputField
          label="Section"
          name="section"
          defaultValue={data?.section}
          register={register}
          error={errors.section}
          placeholder="A"
        />
        <InputField
          label="Capacity"
          name="capacity"
          type="number"
          defaultValue={data?.capacity?.toString()}
          register={register}
          error={errors.capacity}
          placeholder="20"
        />
        <InputField
          label="Grade Level"
          name="grade"
          type="number"
          defaultValue={data?.grade?.toString()}
          register={register}
          error={errors.grade}
          placeholder="5"
        />

        {/* Supervisor */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-xs font-medium text-gray-500">Supervisor (Class Teacher)</label>
          <select
            {...register("supervisor")}
            defaultValue={data?.supervisor || ""}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Supervisor</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.name}>
                {teacher.name}
              </option>
            ))}
          </select>
          {errors.supervisor && <p className="text-xs text-red-500">{errors.supervisor.message}</p>}
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
        {isSubmitting ? "Saving..." : mode === "create" ? "Create Class" : "Update Class"}
      </button>
    </form>
  );
}