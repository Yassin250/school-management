// src/app/dashboard/parent/fees/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ParentFeesClient from "./ParentFeesClient";

export default async function ParentFeesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parentId = session.user.id;

  // Fetch parent with children
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

  // Since there's no Fee model yet, we'll create placeholder data structure
  // When you add a Fee model, replace this with real Prisma queries
  const children = parent.students.map((student) => {
    // Placeholder fee data - replace with real data when Fee model exists
    const feeStructure = {
      tuitionFee: 500,
      libraryFee: 50,
      labFee: 100,
      activityFee: 75,
      transportFee: 150,
      totalFee: 875,
    };

    // Simulated payment data (replace with real data)
    const payments = [
      { id: 1, date: "2026-01-15", amount: 500, method: "Bank Transfer", status: "Completed", reference: "TXN-2026-001" },
      { id: 2, date: "2026-03-10", amount: 375, method: "Cash", status: "Pending", reference: "TXN-2026-002" },
    ];

    const totalPaid = payments
      .filter((p) => p.status === "Completed")
      .reduce((sum, p) => sum + p.amount, 0);
    
    const balance = feeStructure.totalFee - totalPaid;

    return {
      id: student.id,
      name: `${student.name} ${student.surname}`,
      className: student.class?.name ?? "N/A",
      gradeLevel: student.grade?.level ?? 0,
      sex: student.sex,
      feeStructure,
      payments,
      totalPaid,
      balance,
      totalFee: feeStructure.totalFee,
    };
  });

  return (
    <ParentFeesClient
      parentName={`${parent.name} ${parent.surname}`}
      children={children}
    />
  );
}