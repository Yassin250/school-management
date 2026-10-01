import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth/session";
import { canForUser } from "@/lib/permissions/can";
import { prisma } from "@/lib/prisma";
import { ReportCardActions } from "./report-card-actions";

export const metadata = {
  title: "Report Cards - Admin",
};

export default async function AdminReportsPage() {
  const user = await requireCurrentUser();

  const canGenerate = await canForUser(user, "report_cards.generate");

  if (!canGenerate) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-medium text-red-900">Access denied</h1>
        <p className="mt-1 text-sm text-red-700">
          You do not have permission to manage report cards.
        </p>
        <Link
          href="/dashboard/admin"
          className="mt-4 inline-block text-sm font-medium text-red-900 underline"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  // Load current term + academic year
  const currentTerm = await prisma.term.findFirst({
    where: { isCurrent: true },
    include: { academicYear: true },
  });

  if (!currentTerm) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center">
        <p className="text-sm text-neutral-500">
          No current academic term is configured.
        </p>
      </div>
    );
  }

  // Load all active students with their current class
  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: "ACTIVE",
      academicYearId: currentTerm.academicYearId,
    },
    include: {
      student: {
        select: {
          id: true,
          studentCode: true,
          firstName: true,
          lastName: true,
        },
      },
      class: { select: { id: true, name: true } },
    },
    orderBy: [
      { class: { name: "asc" } },
      { student: { lastName: "asc" } },
    ],
  });

  // Load existing report cards for this term
  const reportCards = await prisma.reportCard.findMany({
    where: { termId: currentTerm.id },
    select: { id: true, studentId: true, status: true },
  });
  const rcByStudent = new Map(reportCards.map((rc) => [rc.studentId, rc]));

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-neutral-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Report Cards
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          {currentTerm.academicYear.name} · {currentTerm.name}
        </p>
      </header>

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-medium text-neutral-900">
            Students ({enrollments.length})
          </h2>
        </div>

        {enrollments.length === 0 ? (
          <div className="p-6 text-center text-sm text-neutral-500">
            No active students for the current academic year.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Class</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => {
                const rc = rcByStudent.get(e.student.id);
                return (
                  <tr
                    key={e.student.id}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-neutral-500">
                      {e.student.studentCode}
                    </td>
                    <td className="px-6 py-3 text-neutral-900">
                      {e.student.lastName} {e.student.firstName}
                    </td>
                    <td className="px-6 py-3 text-neutral-600">
                      {e.class.name}
                    </td>
                    <td className="px-6 py-3">
                      {rc ? (
                        <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                          {rc.status}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">
                          Not generated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <ReportCardActions
                        studentId={e.student.id}
                        termId={currentTerm.id}
                        reportCardId={rc?.id ?? null}
                        status={rc?.status ?? null}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}