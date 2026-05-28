"use client";

import InputField from "@/component/InputField";
import { createTeacher, updateTeacher } from "@/lib/actions/teacher";
import type { TeacherFormInitialData } from "@/lib/data/teacher";
import {
  teacherCreateSchema,
  teacherUpdateSchema,
  type TeacherCreateFormData,
  type TeacherUpdateFormData,
} from "@/lib/formValidation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

type RelatedData = {
  subjects: { id: string; name: string }[];
  classes: { id: string; name: string }[];
};

type Props = {
  mode: "create" | "update";
  data?: TeacherFormInitialData;
  relatedData: RelatedData;
};

type FormValues = TeacherCreateFormData | TeacherUpdateFormData;

export default function TeacherForm({ mode, data, relatedData }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(mode === "create" ? teacherCreateSchema : teacherUpdateSchema),
    defaultValues: {
      id: data?.id,
      username: data?.username ?? "",
      name: data?.name ?? "",
      surname: data?.surname ?? "",
      email: data?.email ?? "",
      phone: data?.phone ?? "",
      address: data?.address ?? "",
      sex: data?.sex ?? "MALE",
      birthday: data?.birthday ?? "",
      img: data?.img ?? "",
      subjects: data?.subjects?.map(Number) ?? [],
      classes: data?.classes?.map(Number) ?? [],
      ...(mode === "create" && { password: "", confirmPassword: "" }),
    },
  });

  const onSubmit = async (formData: FormValues) => {
    if (!data?.id && mode === "update") {
      toast.error("Teacher ID is missing");
      return;
    }

    setIsLoading(true);

    try {
      const result =
        mode === "create"
          ? await createTeacher(formData as TeacherCreateFormData)
          : await updateTeacher(data!.id, formData as TeacherUpdateFormData);

      if (result.success) {
        toast.success(`Teacher ${mode === "create" ? "created" : "updated"} successfully`);
        router.push("/dashboard/admin/list/teachers");
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

  const { subjects, classes } = relatedData;
  const isSubmittingForm = isSubmitting || isLoading;

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold text-gray-900">
        {mode === "create" ? "Create a new teacher" : "Update the teacher"}
      </h1>

      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        Account Information
      </span>
      <div className="flex flex-wrap gap-4">
        <InputField
          label="Username"
          name="username"
          register={register}
          error={errors.username}
          placeholder="sarah.wilson"
        />
        {mode === "create" && (
          <>
            <InputField
              label="Password"
              name="password"
              type="password"
              register={register}
              error={"password" in errors ? errors.password : undefined}
              placeholder="Minimum 6 characters"
            />
            <InputField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              register={register}
              error={"confirmPassword" in errors ? errors.confirmPassword : undefined}
              placeholder="Repeat password"
            />
          </>
        )}
      </div>

      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        Personal Information
      </span>
      <div className="flex flex-wrap gap-4">
        <InputField
          label="First Name"
          name="name"
          register={register}
          error={errors.name}
          placeholder="Sarah"
        />
        <InputField
          label="Surname"
          name="surname"
          register={register}
          error={errors.surname}
          placeholder="Wilson"
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          register={register}
          error={errors.email}
          placeholder="sarah@school.com"
        />
        <InputField
          label="Phone"
          name="phone"
          register={register}
          error={errors.phone}
          placeholder="+250780000000"
        />
        <InputField
          label="Address"
          name="address"
          register={register}
          error={errors.address}
          placeholder="123 Oak Street"
        />
        <InputField
          label="Profile Image URL"
          name="img"
          register={register}
          error={errors.img}
          placeholder="https://example.com/photo.jpg"
        />

        <div className="flex flex-col gap-1 w-full md:w-[calc(50%-0.5rem)]">
          <label className="text-xs font-medium text-gray-500">Sex</label>
          <select
            {...register("sex")}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {errors.sex && <p className="text-xs text-red-500">{errors.sex.message}</p>}
        </div>

        <InputField
          label="Date of Birth"
          name="birthday"
          type="date"
          register={register}
          error={errors.birthday}
        />
      </div>

      {subjects.length > 0 ? (
        <div className="space-y-2">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            Subjects
          </span>
          <Controller
            name="subjects"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-1 w-full">
                <select
                  multiple
                  value={field.value?.map(String) ?? []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (o) =>
                      Number(o.value)
                    );
                    field.onChange(selected);
                  }}
                  className="min-h-[120px] p-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                {errors.subjects && (
                  <p className="text-xs text-red-500">{errors.subjects.message}</p>
                )}
                <p className="text-xs text-gray-400">Hold Ctrl/Cmd to select multiple subjects</p>
              </div>
            )}
          />
        </div>
      ) : (
        <p className="text-sm text-amber-600">
          No subjects in the database. Add subjects before assigning teachers.
        </p>
      )}

      {classes.length > 0 ? (
        <div className="space-y-2">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            Supervised Classes (optional)
          </span>
          <Controller
            name="classes"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-1 w-full">
                <select
                  multiple
                  value={field.value?.map(String) ?? []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (o) =>
                      Number(o.value)
                    );
                    field.onChange(selected);
                  }}
                  className="min-h-[120px] p-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                {errors.classes && (
                  <p className="text-xs text-red-500">{errors.classes.message}</p>
                )}
                <p className="text-xs text-gray-400">
                  Optional. Hold Ctrl/Cmd to select multiple classes this teacher supervises.
                </p>
              </div>
            )}
          />
        </div>
      ) : (
        <p className="text-sm text-gray-500">No classes available yet.</p>
      )}

      <button
        type="submit"
        disabled={isSubmittingForm || (mode === "create" && subjects.length === 0)}
        className="w-full md:w-fit px-8 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {isSubmittingForm
          ? "Saving..."
          : mode === "create"
            ? "Create Teacher"
            : "Update Teacher"}
      </button>
    </form>
  );
}
