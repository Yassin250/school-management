import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth/session";
import { listPendingReviews } from "@/lib/services/principal/reviews";

export const metadata = {
  title: "Principal Dashboard",
};

export default async function PrincipalDashboard() {
  const user = await requireCurrentUser();
  const pending = await listPendingReviews(user);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Principal Dashboard
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Welcome, {user.email}
        </p>
      </header>

      <section>
        <h2 className="text-lg font-medium text-neutral-900">
          Pending Reviews
        </h2>

        {pending.length === 0 ? (
          <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-6 text-center">
            <p className="text-sm text-neutral-500">
              No assessments awaiting review.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {pending.map((r) => (
              <Link
                key={r.assessmentId}
                href={`/dashboard/principal/reviews/${r.assessmentId}`}
                className="block rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-neutral-400 hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-medium text-neutral-900">
                      {r.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {r.subjectName ?? r.moduleName ?? "-"} - {r.className} -
                      by {r.teacherName}
                    </p>
                  </div>
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {r.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-neutral-500">
                  <span>
                    {r.resultCount} of {r.studentCount} students marked
                  </span>
                  {r.submittedAt && (
                    <span>Submitted {r.submittedAt.toISOString().slice(0, 10)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}