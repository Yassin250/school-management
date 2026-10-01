import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAssessmentDetail } from "@/lib/services/teacher/assessment-detail";
import { MarkEntryForm } from "./mark-entry-form";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

interface PageProps {
  params: Promise<{ classId: string; assessmentId: string }>;
}

export default async function AssessmentDetailPage({ params }: PageProps) {
  const { classId, assessmentId } = await params;
  const user = await requireCurrentUser();

  let data;
  try {
    data = await getAssessmentDetail(user, assessmentId);
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

  const { assessment, students } = data;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/teacher/classes/${classId}`}
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Back to {assessment.className}
        </Link>
      </div>

      {/* Header */}
      <header className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              {assessment.title}
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              {assessment.subjectName ?? assessment.moduleName ?? "-"} -{" "}
              {assessment.className} - {assessment.academicYearName} -{" "}
              {assessment.termName}
            </p>
          </div>
          <span className="rounded-md bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
            {assessment.status}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-600">
          <span>
            Type:{" "}
            <strong className="text-neutral-900">
              {assessment.type.replace(/_/g, " ")}
            </strong>
          </span>
          <span>
            Max Score:{" "}
            <strong className="text-neutral-900">{assessment.maxScore}</strong>
          </span>
          {assessment.weight && (
            <span>
              Weight:{" "}
              <strong className="text-neutral-900">{assessment.weight}%</strong>
            </span>
          )}
          {assessment.assessmentDate && (
            <span>
              Date:{" "}
              <strong className="text-neutral-900">
                {assessment.assessmentDate.toISOString().slice(0, 10)}
              </strong>
            </span>
          )}
        </div>
      </header>

      {/* Read-only banner */}
      {!assessment.isEditable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Marks are read-only. The assessment is currently{" "}
          <strong>{assessment.status}</strong>.
        </div>
      )}

      {/* Mark entry */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-neutral-900">Students</h2>
          <span className="text-sm text-neutral-500">
            {students.length} student{students.length === 1 ? "" : "s"}
          </span>
        </div>

        <MarkEntryForm
          assessmentId={assessment.id}
          maxScore={assessment.maxScore}
          editable={assessment.isEditable}
          initialStudents={students}
        />
      </section>
    </div>
  );
}