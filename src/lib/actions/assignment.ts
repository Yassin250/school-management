// src/lib/actions/assignment.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createAssignment({
  title,
  lessonId,
  dueDateStr,
}: {
  title: string;
  lessonId: number;
  dueDateStr: string;
}) {
  try {
    const assignment = await prisma.assignment.create({
      data: {
        title,
        startDate: new Date(),
        dueDate: new Date(dueDateStr),
        lessonId,
      },
    });

    revalidatePath("/dashboard/teacher/assignments");
    return { success: true, data: assignment };
  } catch (error) {
    console.error("Create assignment error:", error);
    return { success: false, error: "Failed to create assignment" };
  }
}

export async function deleteAssignment(id: number) {
  try {
    // Delete associated results first, if any
    await prisma.result.deleteMany({
      where: { assignmentId: id },
    });

    await prisma.assignment.delete({
      where: { id },
    });

    revalidatePath("/dashboard/teacher/assignments");
    return { success: true };
  } catch (error) {
    console.error("Delete assignment error:", error);
    return { success: false, error: "Failed to delete assignment" };
  }
}
