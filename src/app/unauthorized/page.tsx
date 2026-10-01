import Link from "next/link";

export const metadata = {
  title: "Access denied",
};

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Access denied
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          You do not have permission to access this page.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}