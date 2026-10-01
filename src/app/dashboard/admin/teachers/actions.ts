"use server";

import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/session";
import { createTeacher, type CreateTeacherInput } from "@/lib/services/admin/teachers";

export async function createTeacherAction(formData: FormData) {
  const user = await requireCurrentUser();

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const sex = formData.get("sex") as "MALE" | "FEMALE";
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const nationalId = (formData.get("nationalId") as string) || undefined;
  const qualification = (formData.get("qualification") as string) || undefined;
  const hireDate = (formData.get("hireDate") as string) || undefined;

  const input: CreateTeacherInput = {
    firstName,
    lastName,
    sex,
    phone,
    email,
    nationalId,
    qualification,
    hireDate,
  };

  await createTeacher(user, input);
  redirect("/dashboard/admin/teachers");
}
