// ============================================================
// Teacher - Class Detail Page
// ============================================================

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/session";
import { getTeacherClassDetail } from "@/lib/services/teacher/class-detail";
import { listAssessmentsForClass } from "@/lib/services/teacher/assessments";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default async function TeacherClassDetailPage({
  params,
}: PageProps) {
  const { classId } = await params;
  const user = await requireCurrentUser();

  let detail;
  let assessments;
  try {
    detail = await getTeacherClassDetail(user, classId);
    assessments = await listAssessmentsForClass(user, classId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    if (error instanceof ForbiddenError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-medium text-red-900">Access denied</h1>
          <p className="mt-1 text-sm text-red-700">
            You do not have access to this class.
          </p>
          <Link
            href="/dashboard/teacher"
            className="mt-4 inline-block text-sm font-medium text-red-900 underline"
          >
            Back to my classes
          </Link>
        </div>
      );
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/teacher"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Back to my classes
        </Link>
      </div>

      {/* Header */}
      <header className="rounded-lg border border-neutral-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-neutral-900">
          {detail.className}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          {detail.educationLevelName} - {detail.academicYearName}
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-600">
          <span>
            <strong className="text-neutral-900">
              {detail.students.length}
            </strong>{" "}
            student{detail.students.length === 1 ? "" : "s"} enrolled
          </span>
          <span>
            Capacity:{" "}
            <strong className="text-neutral-900">{detail.capacity}</strong>
          </span>
          {detail.classTeacherName && (
            <span>
              Class teacher:{" "}
              <strong className="text-neutral-900">
                {detail.classTeacherName}
              </strong>
            </span>
          )}
        </div>
      </header>

      {/* My subjects in this class */}
      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-medium text-neutral-900">
          My subjects in this class
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          You are assigned to teach these subjects to {detail.className}.
        </p>
        {detail.subjects.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            You are not assigned to teach any subject in this class.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {detail.subjects.map((s, i) => (
              <span
                key={i}
                className="rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-blue-200"
              >
                {s.subjectName ?? s.moduleName ?? "Unknown"}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Class subjects - all subjects the class takes */}
      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-medium text-neutral-900">
          Class subjects
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          All subjects taught in {detail.className}. Lower secondary (S1-S3)
          students take all of these - no choice.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {detail.allSubjects.map((s) => (
            <span
              key={s.id}
              className="rounded-md bg-neutral-50 px-3 py-1 text-sm text-neutral-700 ring-1 ring-neutral-200"
            >
              {s.name}
            </span>
          ))}
        </div>
      </section>

      {/* Assessments */}
      <section className="rounded-lg border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-medium text-neutral-900">
            Assessments
          </h2>
          <Link
            href={`/dashboard/teacher/classes/${classId}/assessments/new`}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            + New Assessment
          </Link>
        </div>

        {assessments.length === 0 ? (
          <div className="p-6 text-center text-sm text-neutral-500">
            No assessments created yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3">Max</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-neutral-100 last:border-0"
                >
                  <td className="px-6 py-3 text-neutral-900">{a.title}</td>
                  <td className="px-6 py-3 text-neutral-600">
                    {a.type.replace(/_/g, " ")}
                  </td>
                  <td className="px-6 py-3 text-neutral-600">
                    {a.subjectName ?? a.moduleName ?? "-"}
                  </td>
                  <td className="px-6 py-3 text-neutral-600">{a.maxScore}</td>
                  <td className="px-6 py-3">
                    <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Students */}
      <section className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-medium text-neutral-900">Students</h2>
        </div>

        {detail.students.length === 0 ? (
          <div className="p-6 text-center text-sm text-neutral-500">
            No students are enrolled in this class.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Sex</th>
              </tr>
            </thead>
            <tbody>
              {detail.students.map((s) => (
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
                  <td className="px-6 py-3 text-neutral-600">{s.sex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}