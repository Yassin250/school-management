import { requireCurrentUser } from "@/lib/auth/session";
import { getParentOverview } from "@/lib/services/parent/grades";

export const metadata = {
  title: "Parent Portal - Children & Progress",
};

export default async function ParentDashboard() {
  const user = await requireCurrentUser();

  if (!user.parentId) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-900">Parent Profile Not Linked</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Your user account is not currently linked to an active parent/guardian record. Please contact the school registrar.
        </p>
      </div>
    );
  }

  const data = await getParentOverview(user);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Parent / Guardian Portal</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Viewing academic progress and reports for your linked children.
        </p>
      </div>

      {/* Children Overview Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-neutral-900">Linked Children ({data.children.length})</h2>

        {data.children.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-neutral-500">
              No students are currently linked to your parent account.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {data.children.map((child) => (
              <div
                key={child.studentId}
                className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                      {child.studentCode}
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-neutral-900">
                      {child.firstName} {child.lastName}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Class: <span className="font-semibold text-neutral-700">{child.className}</span>
                      {child.relationship && ` * Relationship: ${child.relationship}`}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Term Avg
                    </span>
                    <div className="text-2xl font-extrabold text-blue-600">
                      {child.averageScorePercent !== null ? `${child.averageScorePercent}%` : "N/A"}
                    </div>
                  </div>
                </div>

                                <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4 text-xs text-neutral-600">
                  <span>
                    {child.assessmentsCount} Approved Assessment
                    {child.assessmentsCount === 1 ? "" : "s"}
                  </span>
                  {child.latestReportCardStatus && (
                    <span className="rounded-md bg-emerald-50 px-2 py-1 font-semibold text-emerald-700 border border-emerald-200">
                      Report Card: {child.latestReportCardStatus}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}