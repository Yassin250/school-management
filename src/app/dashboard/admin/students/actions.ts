"use server";

import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/session";
import { createStudent, type CreateStudentInput } from "@/lib/services/admin/students";

export async function createStudentAction(formData: FormData) {
  const user = await requireCurrentUser();

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const sex = formData.get("sex") as "MALE" | "FEMALE";
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const nationality = (formData.get("nationality") as string) || "Rwandan";
  const nationalId = (formData.get("nationalId") as string) || undefined;
  const phone = (formData.get("phone") as string) || undefined;
  const email = (formData.get("email") as string) || undefined;
  const address = (formData.get("address") as string) || undefined;
  const initialClassId = (formData.get("initialClassId") as string) || undefined;
  const academicYearId = (formData.get("academicYearId") as string) || undefined;

  const input: CreateStudentInput = {
    firstName,
    lastName,
    sex,
    dateOfBirth,
    nationality,
    nationalId,
    phone,
    email,
    address,
    initialClassId,
    academicYearId,
  };

  await createStudent(user, input);
  redirect("/dashboard/admin/students");
}
