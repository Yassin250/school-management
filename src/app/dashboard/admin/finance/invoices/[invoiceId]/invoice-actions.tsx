"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { issueInvoiceAction, cancelInvoiceAction } from "../actions";

interface Props {
  invoiceId: string;
  status: string;
  canIssue: boolean;
  canCancel: boolean;
}

export function InvoiceActions({
  invoiceId,
  status,
  canIssue,
  canCancel,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState("");

  function handleIssue() {
    setError(null);
    startTransition(async () => {
      const result = await issueInvoiceAction(invoiceId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleCancel() {
    if (reason.trim().length < 5) {
      setError("Please enter a reason of at least 5 characters.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await cancelInvoiceAction(invoiceId, reason.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      setShowCancel(false);
      router.refresh();
    });
  }

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

      {showCancel && (
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <label
            htmlFor="cancelReason"
            className="block text-sm font-medium text-neutral-700"
          >
            Reason for cancelling
          </label>
          <textarea
            id="cancelReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            placeholder="Explain why this invoice is being cancelled (min 5 characters)"
          />
          <div className="mt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowCancel(false);
                setReason("");
                setError(null);
              }}
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              Keep invoice
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {isPending ? "Cancelling..." : "Confirm Cancel"}
            </button>
          </div>
        </div>
      )}

      {!showCancel && (
        <div className="flex items-center justify-end gap-3">
          {canCancel && status !== "CANCELLED" && (
            <button
              type="button"
              onClick={() => setShowCancel(true)}
              disabled={isPending}
              className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              Cancel Invoice
            </button>
          )}
          {canIssue && status === "DRAFT" && (
            <button
              type="button"
              onClick={handleIssue}
              disabled={isPending}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {isPending ? "Issuing..." : "Issue Invoice"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}