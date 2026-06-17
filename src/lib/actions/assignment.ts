"use server";

import { actionSuccess, type ActionResult } from "@/lib/actions/types";
import { withPermission } from "@/lib/actions/helpers";
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
}): Promise<ActionResult<Awaited<ReturnType<typeof prisma.assignment.create>>>> {
  return withPermission("assignment:manage", async () => {
    const assignment = await prisma.assignment.create({
      data: {
        title,
        startDate: new Date(),
        dueDate: new Date(dueDateStr),
        lessonId,
      },
    });

    revalidatePath("/dashboard/teacher/assignments");
    return actionSuccess(assignment);
  }, "Failed to create assignment");
}

export async function deleteAssignment(id: number): Promise<ActionResult<void>> {
  return withPermission("assignment:manage", async () => {
    await prisma.$transaction(async (tx) => {
      await tx.result.deleteMany({
        where: { assignmentId: id },
      });

      await tx.assignment.delete({
        where: { id },
      });
    });

    revalidatePath("/dashboard/teacher/assignments");
    return actionSuccess();
  }, "Failed to delete assignment");
}
