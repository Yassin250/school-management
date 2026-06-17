"use client";

import ErrorFallback from "@/component/ErrorFallback";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ErrorFallback
          title="Application error"
          message={error.message || "A critical error occurred."}
          reset={reset}
        />
      </body>
    </html>
  );
}
