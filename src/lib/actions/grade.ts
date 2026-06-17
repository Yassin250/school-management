"use server";

import { actionSuccess, type ActionResult } from "@/lib/actions/types";
import { withPermission } from "@/lib/actions/helpers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveGrades({
  examId,
  assignmentId,
  records,
}: {
  examId?: number;
  assignmentId?: number;
  records: { studentId: string; score: number }[];
}): Promise<ActionResult<void>> {
  return withPermission("grade:manage", async () => {
    if (!examId && !assignmentId) {
      return { success: false, error: "Must specify an Exam or Assignment" };
    }

    await prisma.$transaction(async (tx) => {
      for (const rec of records) {
        const existing = await tx.result.findFirst({
          where: {
            studentId: rec.studentId,
            ...(examId ? { examId } : { assignmentId }),
          },
        });

        if (existing) {
          await tx.result.update({
            where: { id: existing.id },
            data: { score: rec.score },
          });
        } else {
          await tx.result.create({
            data: {
              studentId: rec.studentId,
              score: rec.score,
              ...(examId ? { examId } : { assignmentId }),
            },
          });
        }
      }
    });

    revalidatePath("/dashboard/teacher/grades");
    return actionSuccess();
  }, "Failed to save grades");
}
