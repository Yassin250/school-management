"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import InputField from "@/component/InputField";
import { subjectSchema, type SubjectFormData } from "@/lib/formValidation";

type Props = {
  mode: "create" | "update";
  data?: any;
  setOpen?: (open: boolean) => void;
  relatedData?: {
    teachers: { id: string; name: string }[];
    classes: { id: string; name: string }[];
  };
};

export default function SubjectForm({ mode, data, setOpen, relatedData }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: data?.name || "",
      code: data?.code || "",
      teachers: data?.teachers || [],
      classes: data?.classes || [],
      periodsPerWeek: data?.periodsPerWeek || 4,
    },
  });

  const onSubmit = async (formData: SubjectFormData) => {
    try {
      console.log(mode === "create" ? "Creating subject:" : "Updating subject:", formData);
      await new Promise((r) => setTimeout(r, 500));

      toast.success(`Subject ${mode === "create" ? "created" : "updated"} successfully!`);
      setOpen?.(false);
      router.push("/dashboard/admin/list/subjects");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  const teachers = relatedData?.teachers || [];
  const classes = relatedData?.classes || [];

  return (
    <form className="flex flex-col gap-8 max-w-3xl mx-auto" onSubmit={handleSubmit(onSubmit)}>
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
          defaultValue={data?.name}
          register={register}
          error={errors.name}
          placeholder="Mathematics"
        />
        <InputField
          label="Subject Code"
          name="code"
          defaultValue={data?.code}
          register={register}
          error={errors.code}
          placeholder="MATH-101"
        />
        <InputField
          label="Periods per Week"
          name="periodsPerWeek"
          type="number"
          defaultValue={data?.periodsPerWeek?.toString()}
          register={register}
          error={errors.periodsPerWeek}
          placeholder="4"
        />
        {data?.id && (
          <InputField label="Id" name="id" defaultValue={data?.id} register={register} hidden />
        )}
      </div>

      {/* Teachers */}
      <div className="space-y-2">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
          Assigned Teachers
        </span>
        <div className="flex flex-col gap-1 w-full">
          <select
            multiple
            {...register("teachers")}
            defaultValue={data?.teachers || []}
            className="min-h-[120px] p-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.name}>
                {teacher.name}
              </option>
            ))}
          </select>
          {errors.teachers && <p className="text-xs text-red-500">{errors.teachers.message}</p>}
          <p className="text-xs text-gray-400">Hold Ctrl/Cmd to select multiple teachers</p>
        </div>
      </div>

      {/* Classes */}
      <div className="space-y-2">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
          Classes
        </span>
        <div className="flex flex-col gap-1 w-full">
          <select
            multiple
            {...register("classes")}
            defaultValue={data?.classes || []}
            className="min-h-[120px] p-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.name}>
                {cls.name}
              </option>
            ))}
          </select>
          {errors.classes && <p className="text-xs text-red-500">{errors.classes.message}</p>}
          <p className="text-xs text-gray-400">Hold Ctrl/Cmd to select multiple classes</p>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full md:w-fit px-8 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
      >
        {isSubmitting ? "Saving..." : mode === "create" ? "Create Subject" : "Update Subject"}
      </button>
    </form>
  );
}