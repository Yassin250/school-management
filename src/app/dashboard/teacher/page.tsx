import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth/session";
import { getTeacherClasses } from "@/lib/services/teacher/classes";

export const metadata = {
  title: "Teacher Dashboard",
};

export default async function TeacherDashboard() {
  const user = await requireCurrentUser();
  const classes = await getTeacherClasses(user);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Teacher Dashboard
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Welcome, {user.email}
        </p>
      </header>

      <section>
        <h2 className="text-lg font-medium text-neutral-900">
          My Classes
        </h2>

        {classes.length === 0 ? (
          <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-6 text-center">
            <p className="text-sm text-neutral-500">
              You are not assigned to any classes for the current academic year.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls) => (
              <Link
                key={cls.classId}
                href={`/dashboard/teacher/classes/${cls.classId}`}
                className="block rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-neutral-400 hover:shadow-sm"
              >
                <h3 className="text-base font-medium text-neutral-900">
                  {cls.className}
                </h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {cls.educationLevelName} - {cls.academicYearName}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {cls.subjects.map((s) => (
                    <span
                      key={s.assignmentId}
                      className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700"
                    >
                      {s.subjectName ?? s.moduleName ?? "Unknown"}
                    </span>
                  ))}
                </div>

                <p className="mt-3 text-xs text-neutral-500">
                  {cls.studentCount} student
                  {cls.studentCount === 1 ? "" : "s"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}