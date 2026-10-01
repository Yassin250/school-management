"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startReviewAction, approveAction, returnAction } from "./actions";

interface Props {
  assessmentId: string;
  status: string;
}

export function ReviewActions({ assessmentId, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showReturn, setShowReturn] = useState(false);
  const [returnReason, setReturnReason] = useState("");

  function handleStartReview() {
    setError(null);
    startTransition(async () => {
      const result = await startReviewAction(assessmentId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveAction(assessmentId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/dashboard/principal");
      router.refresh();
    });
  }

  function handleReturn() {
    if (returnReason.trim().length < 5) {
      setError("Please provide a reason of at least 5 characters.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await returnAction(assessmentId, returnReason.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/dashboard/principal");
      router.refresh();
    });
  }

  const isSubmitted = status === "SUBMITTED";
  const isUnderReview = status === "UNDER_REVIEW";

  return (
    <div className="space-y-3">
      {error && (
        <div
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {showReturn && (
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <label
            htmlFor="returnReason"
            className="block text-sm font-medium text-neutral-700"
          >
            Reason for returning
          </label>
          <textarea
            id="returnReason"
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            placeholder="Explain what needs to be corrected (minimum 5 characters)"
          />
          <div className="mt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowReturn(false);
                setReturnReason("");
                setError(null);
              }}
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReturn}
              disabled={isPending}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {isPending ? "Returning..." : "Confirm Return"}
            </button>
          </div>
        </div>
      )}

      {!showReturn && (
        <div className="flex items-center justify-end gap-3">
          {isSubmitted && (
            <>
              <button
                type="button"
                onClick={() => setShowReturn(true)}
                disabled={isPending}
                className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                Return for Correction
              </button>
              <button
                type="button"
                onClick={handleStartReview}
                disabled={isPending}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
              >
                {isPending ? "Starting..." : "Start Review"}
              </button>
            </>
          )}

          {isUnderReview && (
            <>
              <button
                type="button"
                onClick={() => setShowReturn(true)}
                disabled={isPending}
                className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                Return for Correction
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isPending}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
              >
                {isPending ? "Approving..." : "Approve"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}