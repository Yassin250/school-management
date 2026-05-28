"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import InputField from "@/component/InputField";
import { examSchema, type ExamFormData } from "@/lib/formValidation";

type Props = {
  mode: "create" | "update";
  data?: any;
  setOpen?: (open: boolean) => void;
  relatedData?: {
    classes: { id: string; name: string }[];
  };
};

export default function ExamForm({ mode, data, setOpen, relatedData }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      name: data?.name || "",
      type: data?.type || "Mid-Term",
      startDate: data?.startDate || "",
      endDate: data?.endDate || "",
      classes: data?.classes || [],
    },
  });

  const onSubmit = async (formData: ExamFormData) => {
    try {
      console.log(mode === "create" ? "Creating exam:" : "Updating exam:", formData);
      await new Promise((r) => setTimeout(r, 500));

      toast.success(`Exam ${mode === "create" ? "created" : "updated"} successfully!`);
      setOpen?.(false);
      router.push("/dashboard/admin/list/exams");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  const classes = relatedData?.classes || [];

  return (
    <form className="flex flex-col gap-8 max-w-3xl mx-auto" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold text-gray-900">
        {mode === "create" ? "Create a new exam" : "Update the exam"}
      </h1>

      {/* Exam Information */}
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        Exam Information
      </span>
      <div className="flex flex-wrap gap-4">
        <InputField
          label="Exam Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors.name}
          placeholder="Mid-Term Examination"
        />

        {/* Exam Type */}
        <div className="flex flex-col gap-1 w-full md:w-[calc(50%-0.5rem)]">
          <label className="text-xs font-medium text-gray-500">Exam Type</label>
          <select
            {...register("type")}
            defaultValue={data?.type || "Mid-Term"}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Mid-Term">Mid-Term</option>
            <option value="Final">Final</option>
            <option value="Unit Test">Unit Test</option>
            <option value="Pre-Board">Pre-Board</option>
          </select>
          {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
        </div>

        <InputField
          label="Start Date"
          name="startDate"
          type="date"
          defaultValue={data?.startDate}
          register={register}
          error={errors.startDate}
        />
        <InputField
          label="End Date"
          name="endDate"
          type="date"
          defaultValue={data?.endDate}
          register={register}
          error={errors.endDate}
        />

        {data?.id && (
          <InputField label="Id" name="id" defaultValue={data?.id} register={register} hidden />
        )}
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
        {isSubmitting ? "Saving..." : mode === "create" ? "Create Exam" : "Update Exam"}
      </button>
    </form>
  );
}