"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createFeeStructuresBulkAction } from "./bulk-actions";

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

interface TermOption {
  id: string;
  name: string;
  academicYearId: string;
  academicYearName: string;
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
  terms: TermOption[];
  levels: LevelOption[];
  trades: TradeOption[];
}

interface RowState {
  targetId: string; // "level:<id>" or "trade:<id>"
  amount: string;
}

export function BulkFeeForm({ years, terms, levels, trades }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    skippedReasons: { row: number; reason: string }[];
  } | null>(null);

  const currentYear = years.find((y) => y.isCurrent) ?? years[0];
  const currentTerm = terms.find((t) => t.isCurrent) ?? terms[0];

  const [selectedYearId, setSelectedYearId] = useState<string>(
    currentYear?.id ?? "",
  );
  const [selectedTermId, setSelectedTermId] = useState<string>(
    currentTerm?.id ?? "",
  );
  const [targetKind, setTargetKind] = useState<"GENERAL" | "TVET">("GENERAL");

  const generalLevels = levels.filter((l) => l.area === "GENERAL");
  

  // Which levels/trades to show in the bulk rows
  const targetOptions = useMemo(() => {
    if (targetKind === "GENERAL") {
      return generalLevels.map((l) => ({
        id: `level:${l.id}`,
        label: `${l.code} — ${l.name}`,
      }));
    }
    return trades.map((t) => ({
      id: `trade:${t.id}`,
      label: `${t.name}`,
    }));
  }, [targetKind, generalLevels, trades]);

  // Initialize one empty row per target
  const [rows, setRows] = useState<RowState[]>(() =>
    targetOptions.map((o) => ({ targetId: o.id, amount: "" })),
  );

  // When targetKind changes, reset rows
  function handleTargetKindChange(kind: "GENERAL" | "TVET") {
    setTargetKind(kind);
    const opts =
      kind === "GENERAL"
        ? generalLevels.map((l) => ({
            id: `level:${l.id}`,
            label: `${l.code} — ${l.name}`,
          }))
        : trades.map((t) => ({
            id: `trade:${t.id}`,
            label: `${t.name}`,
          }));
    setRows(opts.map((o) => ({ targetId: o.id, amount: "" })));
    setResult(null);
    setError(null);
  }

  function updateAmount(targetId: string, amount: string) {
    setRows((prev) =>
      prev.map((r) => (r.targetId === targetId ? { ...r, amount } : r)),
    );
  }

  // Filtered terms for the year
  const filteredTerms = terms.filter(
    (t) => t.academicYearId === selectedYearId,
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Add rows dynamically
    rows.forEach((r, i) => {
      const [kind, id] = r.targetId.split(":");
      if (kind === "level") {
        formData.set(`rows[${i}][educationLevelId]`, id);
      } else if (kind === "trade") {
        formData.set(`rows[${i}][tradeId]`, id);
      }
      formData.set(`rows[${i}][amount]`, r.amount);
    });
    formData.set("rowCount", String(rows.length));

    startTransition(async () => {
      const res = await createFeeStructuresBulkAction(formData);

      if (res.error) {
        setError(res.error);
        return;
      }

      setResult({
        created: res.created ?? 0,
        skipped: res.skipped ?? 0,
        skippedReasons: res.skippedReasons ?? [],
      });

      if ((res.created ?? 0) > 0) {
        router.refresh();
      }
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

      {result && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <div className="font-medium">
            Created {result.created} fee structure
            {result.created === 1 ? "" : "s"}.
            {result.skipped > 0 &&
              ` Skipped ${result.skipped} row${
                result.skipped === 1 ? "" : "s"
              }.`}
          </div>
          {result.skippedReasons.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs">
              {result.skippedReasons.map((s, i) => (
                <li key={i}>
                  Row {s.row}: {s.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Base name */}
      <div>
        <label
          htmlFor="baseName"
          className="block text-sm font-medium text-neutral-700"
        >
          Base Fee Name
        </label>
        <input
          id="baseName"
          name="baseName"
          type="text"
          required
          placeholder="e.g., Tuition"
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        />
                 <p className="mt-1 text-xs text-neutral-500">
          Each level or trade will get its own fee named &quot;Base Name —
          Level Code&quot; (e.g., &quot;Tuition — S1&quot;).
        </p>
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
          value={selectedYearId}
          onChange={(e) => {
            setSelectedYearId(e.target.value);
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
            <option value="">No terms available</option>
          ) : (
            filteredTerms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.isCurrent ? "(current)" : ""}
              </option>
            ))
          )}
        </select>
      </div>

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
              onChange={() => handleTargetKindChange("GENERAL")}
            />
            <span>General Education Levels</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="targetKind"
              value="TVET"
              checked={targetKind === "TVET"}
              onChange={() => handleTargetKindChange("TVET")}
            />
            <span>TVET Trades</span>
          </label>
        </div>
      </div>

      {/* Bulk amount rows */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-700">
            Amounts per {targetKind === "GENERAL" ? "Level" : "Trade"} (RWF)
          </label>
          <span className="text-xs text-neutral-500">
            {targetOptions.length} rows
          </span>
        </div>
        <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-2">
                  {targetKind === "GENERAL" ? "Level" : "Trade"}
                </th>
                <th className="px-4 py-2 w-48">Amount (RWF)</th>
              </tr>
            </thead>
            <tbody>
              {targetOptions.map((opt) => {
                const row = rows.find((r) => r.targetId === opt.id);
                return (
                  <tr
                    key={opt.id}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-4 py-2 text-neutral-700">
                      {opt.label}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        placeholder="0"
                        value={row?.amount ?? ""}
                        onChange={(e) =>
                          updateAmount(opt.id, e.target.value)
                        }
                        className="block w-full rounded-md border border-neutral-300 px-2 py-1 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
                <p className="mt-2 text-xs text-neutral-500">
          Leave a row&apos;s amount blank to skip that level or trade.
        </p>
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
          Description (optional, applied to all rows)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          placeholder="Any notes about these fees..."
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
          {isPending ? "Creating..." : "Create Fee Structures"}
        </button>
      </div>
    </form>
  );
}