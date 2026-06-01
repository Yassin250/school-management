// src/lib/actions/grade.ts
"use server";

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
}) {
  try {
    if (!examId && !assignmentId) {
      return { success: false, error: "Must specify an Exam or Assignment" };
    }

    // Using transaction to upsert results
    await prisma.$transaction(async (tx) => {
      for (const rec of records) {
        // Find if result already exists for this student and exam/assignment
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
    return { success: true };
  } catch (error) {
    console.error("Save grades error:", error);
    return { success: false, error: "Failed to save grades" };
  }
}
