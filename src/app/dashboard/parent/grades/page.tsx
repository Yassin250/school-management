// src/app/dashboard/parent/grades/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ParentGradesClient from "./ParentGradesClient";

export default async function ParentGradesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parentId = session.user.id;

  // Fetch parent with children and their results
  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    include: {
      students: {
        select: {
          id: true,
          name: true,
          surname: true,
          sex: true,
          class: { select: { name: true } },
          grade: { select: { level: true } },
          results: {
            include: {
              exam: {
                select: {
                  id: true,
                  title: true,
                  startTime: true,
                  lesson: {
                    select: {
                      subject: { select: { name: true } },
                    },
                  },
                },
              },
              assignment: {
                select: {
                  id: true,
                  title: true,
                  dueDate: true,
                  lesson: {
                    select: {
                      subject: { select: { name: true } },
                    },
                  },
                },
              },
            },
            orderBy: {
              exam: { startTime: "desc" },
            },
            take: 50,
          },
        },
      },
    },
  });

  if (!parent) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Parent not found</h1>
      </div>
    );
  }

  // Format children with grade data
  const children = parent.students.map((student) => {
    // Separate exams and assignments
    const examResults = student.results
      .filter((r) => r.exam)
      .map((r) => ({
        id: r.id,
        type: "exam" as const,
        title: r.exam!.title,
        subject: r.exam!.lesson?.subject?.name ?? "N/A",
        score: r.score,
        date: r.exam!.startTime.toISOString().split("T")[0],
        maxScore: 100,
      }));

    const assignmentResults = student.results
      .filter((r) => r.assignment)
      .map((r) => ({
        id: r.id,
        type: "assignment" as const,
        title: r.assignment!.title,
        subject: r.assignment!.lesson?.subject?.name ?? "N/A",
        score: r.score,
        date: r.assignment!.dueDate.toISOString().split("T")[0],
        maxScore: 100,
      }));

    const allResults = [...examResults, ...assignmentResults]
      .sort((a, b) => b.date.localeCompare(a.date));

    // Calculate averages
    const examScores = examResults.map((r) => r.score);
    const assignmentScores = assignmentResults.map((r) => r.score);
    const allScores = [...examScores, ...assignmentScores];

    const examAvg = examScores.length > 0
      ? Math.round(examScores.reduce((a, b) => a + b, 0) / examScores.length)
      : 0;
    const assignmentAvg = assignmentScores.length > 0
      ? Math.round(assignmentScores.reduce((a, b) => a + b, 0) / assignmentScores.length)
      : 0;
    const overallAvg = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

    // Grade distribution
    const gradeDistribution = {
      A: allScores.filter((s) => s >= 90).length,
      B: allScores.filter((s) => s >= 80 && s < 90).length,
      C: allScores.filter((s) => s >= 70 && s < 80).length,
      D: allScores.filter((s) => s >= 60 && s < 70).length,
      F: allScores.filter((s) => s < 60).length,
    };

    // Subject-wise averages
    const subjectScores: Record<string, number[]> = {};
    allResults.forEach((r) => {
      if (!subjectScores[r.subject]) subjectScores[r.subject] = [];
      subjectScores[r.subject].push(r.score);
    });

    const subjectAverages = Object.entries(subjectScores).map(([subject, scores]) => ({
      subject,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      count: scores.length,
    }));

    return {
      id: student.id,
      name: `${student.name} ${student.surname}`,
      className: student.class?.name ?? "N/A",
      gradeLevel: student.grade?.level ?? 0,
      sex: student.sex,
      examAvg,
      assignmentAvg,
      overallAvg,
      totalResults: allResults.length,
      gradeDistribution,
      subjectAverages,
      recentResults: allResults.slice(0, 15),
    };
  });

  return (
    <ParentGradesClient
      parentName={`${parent.name} ${parent.surname}`}
      children={children}
    />
  );
}