"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generateReportCardAction,
  approveReportCardAction,
  publishReportCardAction,
} from "./actions";

interface Props {
  studentId: string;
  termId: string;
  reportCardId: string | null;
  status: string | null;
}

export function ReportCardActions({
  studentId,
  termId,
  reportCardId,
  status,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function runAction(fn: () => Promise<{ error?: string; success?: boolean }>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const canDownload =
    reportCardId && status && ["APPROVED", "PUBLISHED"].includes(status);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}

      {/* Not generated: offer Generate */}
      {!reportCardId && (
        <button
          type="button"
          onClick={() =>
            runAction(() => generateReportCardAction(studentId, termId))
          }
          disabled={isPending}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {isPending ? "Generating..." : "Generate"}
        </button>
      )}

      {/* GENERATED: offer Approve */}
      {reportCardId && status === "GENERATED" && (
        <>
          <span className="text-xs text-neutral-500">Awaiting approval</span>
          <button
            type="button"
            onClick={() =>
              runAction(() => approveReportCardAction(reportCardId))
            }
            disabled={isPending}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isPending ? "Approving..." : "Approve"}
          </button>
        </>
      )}

      {/* APPROVED: offer Publish + Download */}
      {reportCardId && status === "APPROVED" && (
        <>
          <button
            type="button"
            onClick={() =>
              runAction(() => publishReportCardAction(reportCardId))
            }
            disabled={isPending}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {isPending ? "Publishing..." : "Publish"}
          </button>
          <a
            href={`/api/report-cards/${reportCardId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Download PDF
          </a>
        </>
      )}

      {/* PUBLISHED: download only */}
      {reportCardId && status === "PUBLISHED" && (
        <>
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
            Published
          </span>
          <a
            href={`/api/report-cards/${reportCardId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Download PDF
          </a>
        </>
      )}

      {/* Always allow regenerate if there's an existing card */}
      {reportCardId && (
        <button
          type="button"
          onClick={() =>
            runAction(() => generateReportCardAction(studentId, termId))
          }
          disabled={isPending}
          className="text-xs text-neutral-500 underline hover:text-neutral-900 disabled:opacity-60"
        >
          Regenerate
        </button>
      )}
    </div>
  );
}