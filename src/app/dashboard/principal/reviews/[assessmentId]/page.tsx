import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/session";
import { getReviewDetail } from "@/lib/services/principal/reviews";
import { ReviewActions } from "./review-actions";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

interface PageProps {
  params: Promise<{ assessmentId: string }>;
}

export default async function ReviewDetailPage({ params }: PageProps) {
  const { assessmentId } = await params;
  const user = await requireCurrentUser();

  let data;
  try {
    data = await getReviewDetail(user, assessmentId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof ForbiddenError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">
            You do not have access to this assessment.
          </p>
        </div>
      );
    }
    throw error;
  }

  const { review, students } = data;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/principal"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Back to pending reviews
        </Link>
      </div>

      {/* Header */}
      <header className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              {review.title}
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              {review.subjectName ?? review.moduleName ?? "-"} - {review.className}{" "}
              - {review.academicYearName} - {review.termName}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Submitted by {review.teacherName}
            </p>
          </div>
          <StatusBadge status={review.status} />
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-600">
          <span>
            Type:{" "}
            <strong className="text-neutral-900">
              {review.type.replace(/_/g, " ")}
            </strong>
          </span>
          <span>
            Max Score:{" "}
            <strong className="text-neutral-900">{review.maxScore}</strong>
          </span>
          {review.weight && (
            <span>
              Weight: <strong className="text-neutral-900">{review.weight}%</strong>
            </span>
          )}
          {review.submittedAt && (
            <span>
              Submitted:{" "}
              <strong className="text-neutral-900">
                {review.submittedAt.toISOString().slice(0, 10)}
              </strong>
            </span>
          )}
        </div>

        {review.returnedReason && (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            <strong>Returned:</strong> {review.returnedReason}
          </div>
        )}
      </header>

      {/* Students table */}
      <section className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-medium text-neutral-900">Students</h2>
        </div>

        {students.length === 0 ? (
          <div className="p-6 text-center text-sm text-neutral-500">
            No results recorded.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3 w-24">Score</th>
                <th className="px-6 py-3 w-20">Absent</th>
                <th className="px-6 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr
                  key={s.studentId}
                  className="border-b border-neutral-100 last:border-0"
                >
                  <td className="px-6 py-3 font-mono text-xs text-neutral-500">
                    {s.studentCode}
                  </td>
                  <td className="px-6 py-3 text-neutral-900">
                    {s.lastName} {s.firstName}
                  </td>
                  <td className="px-6 py-3 text-neutral-900">
                    {s.isAbsent ? "-" : (s.score ?? "-")}
                  </td>
                  <td className="px-6 py-3 text-neutral-600">
                    {s.isAbsent ? "Yes" : "No"}
                  </td>
                  <td className="px-6 py-3 text-neutral-500">{s.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Actions */}
            {review.isReviewable && (
        <ReviewActions
          assessmentId={review.id}
          status={review.status}
        />
      )}

      {!review.isReviewable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This assessment is in state <strong>{review.status}</strong> and cannot be
          reviewed.
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-neutral-100 text-neutral-700",
    SUBMITTED: "bg-blue-50 text-blue-700",
    UNDER_REVIEW: "bg-amber-50 text-amber-700",
    APPROVED: "bg-green-50 text-green-700",
    RETURNED: "bg-red-50 text-red-700",
    LOCKED: "bg-neutral-800 text-white",
    CORRECTION_PENDING: "bg-purple-50 text-purple-700",
  };
  return (
    <span
      className={`rounded-md px-3 py-1 text-xs font-medium ${styles[status] ?? styles.DRAFT}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}