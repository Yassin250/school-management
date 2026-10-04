"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createFeeStructureAction } from "./actions";

const FEE_TYPES = [
  { value: "TUITION", label: "Tuition" },
  { value: "REGISTRATION", label: "Registration" },
  { value: "EXAM", label: "Exam Fee" },
  { value: "UNIFORM", label: "Uniform" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "LUNCH", label: "Lunch" },
  { value: "ACTIVITY", label: "Activity Fee" },
  { value: "OTHER", label: "Other" },
];

interface YearOption {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface LevelOption {
  id: string;
  code: string;
  name: string;
  area: "GENERAL" | "TVET";
}

interface TradeOption {
  id: string;
  code: string;
  name: string;
}

interface Props {
  years: YearOption[];
  levels: LevelOption[];
  trades: TradeOption[];
}

export function FeeStructureForm({ years, levels, trades }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Target: "GENERAL" (education level) or "TVET" (trade)
  const [targetKind, setTargetKind] = useState<"GENERAL" | "TVET">("GENERAL");

  const currentYear = years.find((y) => y.isCurrent) ?? years[0];

  const generalLevels = levels.filter((l) => l.area === "GENERAL");
  

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createFeeStructureAction(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push("/dashboard/admin/finance/fee-structures");
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

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-neutral-700"
        >
          Fee Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g., Tuition — S1 Term 1"
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        />
      </div>

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
          defaultValue={currentYear?.id ?? ""}
          className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        >
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name} {y.isCurrent ? "(current)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Target kind */}
      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Applies To
        </label>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="targetKind"
              value="GENERAL"
              checked={targetKind === "GENERAL"}
              onChange={() => setTargetKind("GENERAL")}
            />
            <span>General Education</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="targetKind"
              value="TVET"
              checked={targetKind === "TVET"}
              onChange={() => setTargetKind("TVET")}
            />
            <span>TVET Trade</span>
          </label>
        </div>
      </div>

      {/* Target selector — level or trade */}
      {targetKind === "GENERAL" ? (
        <div>
          <label
            htmlFor="educationLevelId"
            className="block text-sm font-medium text-neutral-700"
          >
            Education Level
          </label>
          <select
            id="educationLevelId"
            name="educationLevelId"
            required
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          >
            <option value="">Select a level...</option>
            {generalLevels.map((l) => (
              <option key={l.id} value={`level:${l.id}`}>
                {l.code} — {l.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Applied to all students in this level (all streams).
          </p>
        </div>
      ) : (
        <div>
          <label
            htmlFor="tradeId"
            className="block text-sm font-medium text-neutral-700"
          >
            TVET Trade
          </label>
          <select
            id="tradeId"
            name="educationLevelId"
            required
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          >
            <option value="">Select a trade...</option>
            {trades.map((t) => (
              <option key={t.id} value={`trade:${t.id}`}>
                {t.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Applied to all students in this trade (all levels).
          </p>
        </div>
      )}

      {/* Fee type */}
      <div>
        <label
          htmlFor="feeType"
          className="block text-sm font-medium text-neutral-700"
        >
          Fee Type
        </label>
        <select
          id="feeType"
          name="feeType"
          required
          defaultValue="TUITION"
          className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        >
          {FEE_TYPES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

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
          required
          placeholder="e.g., 150000"
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        />
      </div>

      {/* Mandatory */}
      <div className="flex items-center gap-2">
        <input
          id="isMandatory"
          name="isMandatory"
          type="checkbox"
          defaultChecked
          className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
        />
        <label htmlFor="isMandatory" className="text-sm text-neutral-700">
          Mandatory (all students must pay)
        </label>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-neutral-700"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Any notes about this fee..."
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/dashboard/admin/finance/fee-structures"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create Fee Structure"}
        </button>
      </div>
    </form>
  );
}