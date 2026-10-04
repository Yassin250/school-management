"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordPaymentAction } from "./payment-actions";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "MOBILE_MONEY_MTN", label: "MTN Mobile Money" },
  { value: "MOBILE_MONEY_AIRTEL", label: "Airtel Money" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CARD", label: "Card" },
  { value: "OTHER", label: "Other" },
];

interface ParentOption {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

interface Props {
  invoiceId: string;
  remainingBalance: string;
  parents: ParentOption[];
}

export function PaymentForm({
  invoiceId,
  remainingBalance,
  parents,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const balanceNum = Number(remainingBalance);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await recordPaymentAction(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(
        `Payment ${result.paymentNumber} recorded. New balance: ${Number(result.invoiceBalance ?? 0).toLocaleString("en-RW")} RWF.`,
      );
      setOpen(false);
      router.refresh();
    });
  }

  // If invoice is already paid, don't show the button
  if (balanceNum <= 0) return null;

  return (
    <div>
      {!open && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setError(null);
              setSuccess(null);
            }}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Record Payment
          </button>
        </div>
      )}

      {open && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-neutral-900">
              Record Payment
            </h3>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              className="text-sm text-neutral-500 hover:text-neutral-900"
            >
              Cancel
            </button>
          </div>

          <div className="mb-4 rounded-md border border-emerald-200 bg-white px-3 py-2">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Remaining Balance
            </span>
            <div className="mt-0.5 font-mono text-lg font-bold text-emerald-700">
              {balanceNum.toLocaleString("en-RW")} RWF
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mb-4 rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-800"
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="invoiceId" value={invoiceId} />

            {/* Amount */}
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-neutral-700"
              >
                Amount (RWF)
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="1"
                min="1"
                max={balanceNum}
                required
                placeholder={`Max: ${balanceNum.toLocaleString("en-RW")}`}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Partial payments are supported. Enter any amount up to{" "}
                {balanceNum.toLocaleString("en-RW")} RWF.
              </p>
            </div>

            {/* Method */}
            <div>
              <label
                htmlFor="method"
                className="block text-sm font-medium text-neutral-700"
              >
                Payment Method
              </label>
              <select
                id="method"
                name="method"
                required
                defaultValue="CASH"
                className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference */}
            <div>
              <label
                htmlFor="reference"
                className="block text-sm font-medium text-neutral-700"
              >
                Reference (optional)
              </label>
              <input
                id="reference"
                name="reference"
                type="text"
                placeholder="e.g., Bank ref, MoMo txn ID"
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            {/* Payer */}
            {parents.length > 0 && (
              <div>
                <label
                  htmlFor="payerId"
                  className="block text-sm font-medium text-neutral-700"
                >
                  Payer (optional)
                </label>
                <select
                  id="payerId"
                  name="payerId"
                  className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="">Not specified</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.relationship})
                      {p.isPrimary ? " — primary" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-neutral-700"
              >
                Notes (optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Any notes about this payment..."
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setError(null);
                }}
                className="text-sm text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {isPending ? "Recording..." : "Record Payment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}