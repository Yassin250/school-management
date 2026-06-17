"use client";

import ErrorFallback from "@/component/ErrorFallback";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Dashboard error"
      message={error.message || "Failed to load this page."}
      reset={reset}
    />
  );
}
