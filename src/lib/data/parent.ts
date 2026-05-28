// src/lib/data/parent.ts
import { prisma } from "@/lib/prisma";
import type { Parent, Student } from "@/generated/prisma/client";

export async function getParentRelatedData() {
  // Parents don't need related data for forms (no subjects/classes to select)
  // But we return an empty object to maintain the pattern
  return {};
}

export function mapParentToFormData(
  parent: Parent & { students: Student[] }
) {
  return {
    id: parent.id,
    username: parent.username,
    name: parent.name,
    surname: parent.surname,
    email: parent.email ?? "",
    phone: parent.phone,
    address: parent.address,
  };
}

export type ParentFormInitialData = ReturnType<typeof mapParentToFormData>;