import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/session";
import { getTeacherSubjectsForClass } from "@/lib/services/teacher/assessments";
import { getTeacherClassDetail } from "@/lib/services/teacher/class-detail";
import { NewAssessmentForm } from "./new-assessment-form";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default async function NewAssessmentPage({ params }: PageProps) {
  const { classId } = await params;
  const user = await requireCurrentUser();

  let classDetail;
  let subjects;
  try {
    classDetail = await getTeacherClassDetail(user, classId);
    subjects = await getTeacherSubjectsForClass(user, classId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof ForbiddenError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">
            You do not have access to this class.
          </p>
        </div>
      );
    }
    throw error;
  }

  if (subjects.length === 0) {
    return (
      <div className="space-y-4">
        <Link
          href={`/dashboard/teacher/classes/${classId}`}
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Back to {classDetail.className}
        </Link>
        <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center">
          <p className="text-sm text-neutral-600">
            You are not assigned to teach any subject in this class.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/teacher/classes/${classId}`}
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Back to {classDetail.className}
        </Link>
      </div>

      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">
          New Assessment
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          For {classDetail.className} - {classDetail.academicYearName}
        </p>
      </header>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <NewAssessmentForm classId={classId} subjects={subjects} />
      </div>
    </div>
  );
}