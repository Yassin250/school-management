"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateInvoiceAction } from "./actions";

interface YearOption {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface TermOption {
  id: string;
  name: string;
  academicYearId: string;
  academicYearName: string;
  isCurrent: boolean;
}

interface StudentOption {
  studentId: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  className: string;
}

interface Props {
  years: YearOption[];
  terms: TermOption[];
  students: StudentOption[];
}

export function InvoiceForm({ years, terms, students }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentYear = years.find((y) => y.isCurrent) ?? years[0];
  const currentTerm = terms.find((t) => t.isCurrent) ?? terms[0];

  const [selectedYearId, setSelectedYearId] = useState<string>(
    currentYear?.id ?? "",
  );
  const [selectedTermId, setSelectedTermId] = useState<string>(
    currentTerm?.id ?? "",
  );

  // Filter terms to the selected year
  const filteredTerms = terms.filter(
    (t) => t.academicYearId === selectedYearId,
  );

  // Default due date: 30 days from now
  const defaultDue = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  })();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await generateInvoiceAction(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(
        `Invoice ${result.invoiceNumber ?? ""} created. Redirecting...`,
      );
      router.push(
        `/dashboard/admin/finance/invoices/${result.invoiceId ?? ""}`,
      );
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
        >
          {success}
        </div>
      )}

      {/* Academic year */}
      <div>
        <label
          htmlFor="academicYearId"
          className="block text-sm font-medium text-neutral-700"
        >
          Academic Year
        </label>
        <select
          id="academicYearId"
          name="academicYearId"
          required
          value={selectedYearId}
          onChange={(e) => {
            setSelectedYearId(e.target.value);
            // Reset term selection to first of the new year
            const firstTerm = terms.find(
              (t) => t.academicYearId === e.target.value,
            );
            setSelectedTermId(firstTerm?.id ?? "");
          }}
          className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        >
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name} {y.isCurrent ? "(current)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Term */}
      <div>
        <label
          htmlFor="termId"
          className="block text-sm font-medium text-neutral-700"
        >
          Term
        </label>
        <select
          id="termId"
          name="termId"
          required
          value={selectedTermId}
          onChange={(e) => setSelectedTermId(e.target.value)}
          className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        >
          {filteredTerms.length === 0 ? (
            <option value="">No terms available for this year</option>
          ) : (
            filteredTerms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.isCurrent ? "(current)" : ""}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Student */}
      <div>
        <label
          htmlFor="studentId"
          className="block text-sm font-medium text-neutral-700"
        >
          Student
        </label>
        <select
          id="studentId"
          name="studentId"
          required
          className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        >
          <option value="">Select a student...</option>
          {students.map((s) => (
            <option key={s.studentId} value={s.studentId}>
              {s.studentCode} — {s.lastName} {s.firstName} ({s.className})
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-neutral-500">
           The invoice will include all active fee structures for this
          student&apos;s level or trade in the selected term.
        </p>
      </div>

      {/* Due date */}
      <div>
        <label
          htmlFor="dueDate"
          className="block text-sm font-medium text-neutral-700"
        >
          Due Date
        </label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          required
          defaultValue={defaultDue}
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        />
      </div>

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
          rows={3}
          placeholder="Any notes about this invoice..."
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/dashboard/admin/finance/invoices"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {isPending ? "Generating..." : "Generate Invoice"}
        </button>
      </div>
    </form>
  );
}