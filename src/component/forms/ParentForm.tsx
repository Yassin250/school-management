// src/component/forms/ParentForm.tsx
"use client";

import InputField from "@/component/InputField";
import { createParent, updateParent } from "@/lib/actions/parent";
import {
  parentCreateSchema,
  parentUpdateSchema,
  type ParentCreateFormData,
  type ParentUpdateFormData,
} from "@/lib/formValidation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
  };
};

type FormValues = ParentCreateFormData | ParentUpdateFormData;

export default function ParentForm({ mode, data }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(
      mode === "create" ? parentCreateSchema : parentUpdateSchema
    ),
    defaultValues: {
      id: data?.id,
      username: data?.username ?? "",
      name: data?.name ?? "",
      surname: data?.surname ?? "",
      email: data?.email ?? "",
      phone: data?.phone ?? "",
      address: data?.address ?? "",
      ...(mode === "create" && { password: "", confirmPassword: "" }),
    },
  });

  const onSubmit = async (formData: FormValues) => {
    if (!data?.id && mode === "update") {
      toast.error("Parent ID is missing");
      return;
    }

    setIsLoading(true);

    try {
      const result =
        mode === "create"
          ? await createParent(formData as ParentCreateFormData)
          : await updateParent(data!.id, formData as ParentUpdateFormData);

      if (result.success) {
        toast.success(
          `Parent ${mode === "create" ? "created" : "updated"} successfully`
        );
        router.push("/dashboard/admin/list/parents");
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

  const isSubmittingForm = isSubmitting || isLoading;

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold text-gray-900">
        {mode === "create" ? "Add a new parent" : "Update the parent"}
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
          placeholder="john.doe@email.com"
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
          placeholder="123 Parent Street, Kigali"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmittingForm}
        className="w-full md:w-fit px-8 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {isSubmittingForm
          ? "Saving..."
          : mode === "create"
            ? "Add Parent"
            : "Update Parent"}
      </button>
    </form>
  );
}