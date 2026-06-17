"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

type Props = {
  title?: string;
  message?: string;
  reset?: () => void;
};

export default function ErrorFallback({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  reset,
}: Props) {
  return (
    <div className="flex min-h-[320px] items-center justify-center p-6">
      <div className="glass-card max-w-md w-full p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {reset && (
          <button
            type="button"
            onClick={reset}
            className="btn-primary mt-6 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
