// src/component/forms/StudentForm.tsx
"use client";

import InputField from "@/component/InputField";
import { createStudent, updateStudent } from "@/lib/actions/student";
import {
  studentCreateSchema,
  studentUpdateSchema,
  type StudentCreateFormData,
  type StudentUpdateFormData,
} from "@/lib/formValidation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type RelatedData = {
  classes: { id: string; name: string }[];
  grades: { id: string; level: number }[];
  parents: { id: string; name: string }[];
};

type Props = {
  mode: "create" | "update";
  data?: {
    id?: string;
    username?: string;
    name?: string;
    surname?: string;
    email?: string;
    phone?: string;
    address?: string;
    sex?: "MALE" | "FEMALE";
    birthday?: string;
    img?: string;
    classId?: string;
    gradeId?: string;
    parentId?: string;
  };
  relatedData: RelatedData;
};

type FormValues = StudentCreateFormData | StudentUpdateFormData;

export default function StudentForm({ mode, data, relatedData }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(
      mode === "create" ? studentCreateSchema : studentUpdateSchema
    ),
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
      classId: data?.classId ?? "",
      gradeId: data?.gradeId ?? "",
      parentId: data?.parentId ?? "",
      ...(mode === "create" && { password: "", confirmPassword: "" }),
    },
  });

  const onSubmit = async (formData: FormValues) => {
    if (!data?.id && mode === "update") {
      toast.error("Student ID is missing");
      return;
    }

    setIsLoading(true);

    try {
      const result =
        mode === "create"
          ? await createStudent(formData as StudentCreateFormData)
          : await updateStudent(data!.id, formData as StudentUpdateFormData);

      if (result.success) {
        toast.success(
          `Student ${mode === "create" ? "created" : "updated"} successfully`
        );
        router.push("/dashboard/admin/list/students");
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

  const { classes, grades, parents } = relatedData;
  const isSubmittingForm = isSubmitting || isLoading;

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold text-gray-900">
        {mode === "create" ? "Enroll a new student" : "Update the student"}
      </h1>

      {/* Account Information */}
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        Account Information
      </span>
      <div className="flex flex-wrap gap-4">
        <InputField
          label="Username"
          name="username"
          register={register}
          error={errors.username}
          placeholder="john.doe"
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
              error={
                "confirmPassword" in errors ? errors.confirmPassword : undefined
              }
              placeholder="Repeat password"
            />
          </>
        )}
      </div>

      {/* Personal Information */}
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        Personal Information
      </span>
      <div className="flex flex-wrap gap-4">
        <InputField
          label="First Name"
          name="name"
          register={register}
          error={errors.name}
          placeholder="John"
        />
        <InputField
          label="Surname"
          name="surname"
          register={register}
          error={errors.surname}
          placeholder="Doe"
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          register={register}
          error={errors.email}
          placeholder="john.doe@student.school.com"
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
          placeholder="123 Student Road, Kigali"
        />
        <InputField
          label="Profile Image URL"
          name="img"
          register={register}
          error={errors.img}
          placeholder="https://example.com/photo.jpg"
        />

        {/* Sex */}
        <div className="flex flex-col gap-1 w-full md:w-[calc(50%-0.5rem)]">
          <label className="text-xs font-medium text-gray-500">Sex</label>
          <select
            {...register("sex")}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {errors.sex && (
            <p className="text-xs text-red-500">{errors.sex.message}</p>
          )}
        </div>

        {/* Date of Birth */}
        <InputField
          label="Date of Birth"
          name="birthday"
          type="date"
          register={register}
          error={errors.birthday}
        />
      </div>

      {/* Academic Information */}
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        Academic Information
      </span>
      <div className="flex flex-wrap gap-4">
        {/* Grade Selection */}
        {grades.length > 0 ? (
          <div className="flex flex-col gap-1 w-full md:w-[calc(50%-0.5rem)]">
            <label className="text-xs font-medium text-gray-500">Grade</label>
            <select
              {...register("gradeId")}
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            No grades in the database. Add grades before enrolling students.
          </p>
        )}

        {/* Class Selection */}
        {classes.length > 0 ? (
          <div className="flex flex-col gap-1 w-full md:w-[calc(50%-0.5rem)]">
            <label className="text-xs font-medium text-gray-500">Class</label>
            <select
              {...register("classId")}
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            {errors.classId && (
              <p className="text-xs text-red-500">{errors.classId.message}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-amber-600 w-full">
            No classes in the database. Add classes before enrolling students.
          </p>
        )}

        {/* Parent Selection */}
        {parents.length > 0 ? (
          <div className="flex flex-col gap-1 w-full md:w-[calc(50%-0.5rem)]">
            <label className="text-xs font-medium text-gray-500">
              Parent / Guardian
            </label>
            <select
              {...register("parentId")}
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a parent</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </select>
            {errors.parentId && (
              <p className="text-xs text-red-500">{errors.parentId.message}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-amber-600 w-full">
            No parents in the database. Add parents before enrolling students.
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={
          isSubmittingForm ||
          (mode === "create" &&
            (grades.length === 0 || classes.length === 0 || parents.length === 0))
        }
        className="w-full md:w-fit px-8 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {isSubmittingForm
          ? "Saving..."
          : mode === "create"
            ? "Enroll Student"
            : "Update Student"}
      </button>
    </form>
  );
}