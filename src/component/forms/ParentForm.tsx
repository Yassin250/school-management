"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import InputField from "@/component/InputField";
import { parentSchema, type ParentFormData } from "@/lib/formValidation";

type Props = {
  mode: "create" | "update";
  data?: any;
  setOpen?: (open: boolean) => void;
  relatedData?: {
    students: { id: string; name: string }[];
  };
};

export default function ParentForm({ mode, data, setOpen, relatedData }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ParentFormData>({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      name: data?.name || "",
      email: data?.email || "",
      phone: data?.phone || "",
      address: data?.address || "",
      children: data?.children || [],
    },
  });

  const onSubmit = async (formData: ParentFormData) => {
    try {
      console.log(mode === "create" ? "Creating parent:" : "Updating parent:", formData);
      await new Promise((r) => setTimeout(r, 500));

      toast.success(`Parent ${mode === "create" ? "created" : "updated"} successfully!`);
      setOpen?.(false);
      router.push("/dashboard/admin/list/parents");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  const students = relatedData?.students || [];

  return (
    <form className="flex flex-col gap-8 max-w-3xl mx-auto" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold text-gray-900">
        {mode === "create" ? "Create a new parent" : "Update the parent"}
      </h1>

      {/* Personal Information */}
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        Personal Information
      </span>
      <div className="flex flex-wrap gap-4">
        <InputField
          label="Full Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors.name}
          placeholder="John Doe Sr."
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          defaultValue={data?.email}
          register={register}
          error={errors.email}
          placeholder="parent@email.com"
        />
        <InputField
          label="Phone"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors.phone}
          placeholder="+1 234-567-8901"
        />
        <InputField
          label="Address"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors.address}
          placeholder="123 Oak Street"
        />

        {data?.id && (
          <InputField label="Id" name="id" defaultValue={data?.id} register={register} hidden />
        )}
      </div>

      {/* Children */}
      <div className="space-y-2">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
          Children
        </span>
        <div className="flex flex-col gap-1 w-full">
          <select
            multiple
            {...register("children")}
            defaultValue={data?.children || []}
            className="min-h-[120px] p-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {students.map((student) => (
              <option key={student.id} value={student.name}>
                {student.name}
              </option>
            ))}
          </select>
          {errors.children && <p className="text-xs text-red-500">{errors.children.message}</p>}
          <p className="text-xs text-gray-400">Hold Ctrl/Cmd to select multiple children</p>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full md:w-fit px-8 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
      >
        {isSubmitting ? "Saving..." : mode === "create" ? "Create Parent" : "Update Parent"}
      </button>
    </form>
  );
}