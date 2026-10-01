import { requireCurrentUser } from "@/lib/auth/session";
import { getStudentGradeOverview } from "@/lib/services/student/grades";

export const metadata = {
  title: "Student Portal - Grades & Progress",
};

export default async function StudentDashboard() {
  const user = await requireCurrentUser();

  if (!user.studentId) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-900">Student Profile Not Linked</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Your user account is not currently linked to an active student record. Please contact the school registrar.
        </p>
      </div>
    );
  }

  const data = await getStudentGradeOverview(user);

  return (
    <div className="space-y-6">
      {/* Student Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div>
          <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            {data.student.studentCode}
          </span>
          <h1 className="mt-2 text-2xl font-bold text-neutral-900">
            {data.student.firstName} {data.student.lastName}
          </h1>
          <p className="text-sm text-neutral-500">
            Class: <span className="font-semibold text-neutral-800">{data.student.className}</span> &bull; Academic Year: <span className="font-semibold text-neutral-800">{data.student.academicYearName}</span>
          </p>
        </div>

        {/* Term Average Metric */}
        <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-neutral-100 pt-4 sm:pt-0 sm:pl-6">
          <div className="text-center sm:text-right">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Current Term Average
            </span>
            <div className="mt-1 text-3xl font-extrabold text-blue-600">
              {data.averageScorePercent !== null ? `${data.averageScorePercent}%` : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Report Card Status Banner (if available) */}
      {data.latestReportCard && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📜</span>
              <div>
                <h3 className="text-sm font-semibold text-emerald-900">
                  Official Report Card Available &mdash; {data.latestReportCard.termName}
                </h3>
                <p className="text-xs text-emerald-700">
                  Status: <span className="font-semibold uppercase">{data.latestReportCard.status}</span>
                  {data.latestReportCard.averageScore !== null && ` * Term Average: ${data.latestReportCard.averageScore}%`}
                </p>
              </div>
            </div>
            <span className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
              Approved
            </span>
          </div>
        </div>
      )}

      {/* Approved Assessments Section */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Approved Grades & Marks</h2>
            <p className="text-xs text-neutral-500">
              Only officially reviewed and approved assessment marks are shown.
            </p>
          </div>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
            {data.totalAssessmentsCount} Record{data.totalAssessmentsCount === 1 ? "" : "s"}
          </span>
        </div>

        {data.assessments.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-neutral-500">
              No approved assessment marks published for this term yet.
            </p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-neutral-100 overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600">
              <thead className="bg-neutral-50 text-xs uppercase font-semibold text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Subject / Module</th>
                  <th className="px-4 py-3">Assessment Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Score / Max</th>
                  <th className="px-4 py-3">Percentage</th>
                  <th className="px-4 py-3">Teacher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.assessments.map((a) => (
                  <tr key={a.id} className="hover:bg-neutral-50/50 transition">
                    <td className="px-4 py-3 font-semibold text-neutral-900">
                      {a.subjectName}
                    </td>
                    <td className="px-4 py-3 text-neutral-800">{a.title}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                        {a.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {a.isAbsent ? (
                        <span className="text-amber-600 font-semibold">Absent</span>
                      ) : (
                        `${a.score ?? "-"} / ${a.maxScore}`
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {a.percentage !== null ? (
                        <span
                          className={`font-semibold ${
                            a.percentage >= 50 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {a.percentage}%
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{a.teacherName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}