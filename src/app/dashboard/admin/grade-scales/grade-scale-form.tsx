"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createGradeScaleAction,
  updateGradeScaleAction,
} from "./actions";

export interface BandRow {
  minScore: string;
  maxScore: string;
  symbol: string;
  description: string;
  points: string;
  isPass: boolean;
}

interface Props {
  mode: "create" | "edit";
  scaleId?: string;
  initialName?: string;
  initialDescription?: string;
  initialArea?: "GENERAL" | "TVET";
  initialBands?: BandRow[];
  /** Symbols already on report cards; removing one is refused server-side. */
  protectedSymbols?: string[];
}

const EMPTY_BAND: BandRow = {
  minScore: "",
  maxScore: "",
  symbol: "",
  description: "",
  points: "",
  isPass: true,
};

function makeDefaultBands(area: "GENERAL" | "TVET"): BandRow[] {
  if (area === "TVET") {
    return [
      { minScore: "80", maxScore: "100", symbol: "C", description: "Competent (Distinction)", points: "4", isPass: true },
      { minScore: "60", maxScore: "79.99", symbol: "C+", description: "Competent (Proficient)", points: "3", isPass: true },
      { minScore: "50", maxScore: "59.99", symbol: "C-", description: "Competent (Satisfactory)", points: "2", isPass: true },
      { minScore: "0", maxScore: "49.99", symbol: "NYC", description: "Not Yet Competent", points: "0", isPass: false },
    ];
  }
  return [
    { minScore: "80", maxScore: "100", symbol: "A", description: "Excellent", points: "4", isPass: true },
    { minScore: "70", maxScore: "79.99", symbol: "B", description: "Very Good", points: "3", isPass: true },
    { minScore: "60", maxScore: "69.99", symbol: "C", description: "Good", points: "2", isPass: true },
    { minScore: "50", maxScore: "59.99", symbol: "D", description: "Satisfactory", points: "1", isPass: true },
    { minScore: "0", maxScore: "49.99", symbol: "F", description: "Fail", points: "0", isPass: false },
  ];
}

const LIST_PATH = "/dashboard/admin/grade-scales";

export function GradeScaleForm({
  mode,
  scaleId,
  initialName = "",
  initialDescription = "",
  initialArea = "GENERAL",
  initialBands,
  protectedSymbols = [],
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [area, setArea] = useState<"GENERAL" | "TVET">(initialArea);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [bands, setBands] = useState<BandRow[]>(
    initialBands ?? makeDefaultBands(initialArea),
  );
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Array<{ path: string; message: string }>>([]);

  function updateBand(index: number, patch: Partial<BandRow>) {
    setBands((prev) =>
      prev.map((band, i) => (i === index ? { ...band, ...patch } : band)),
    );
  }

  function addBand() {
    setBands((prev) => [...prev, { ...EMPTY_BAND }]);
  }

  function removeBand(index: number) {
    setBands((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAreaChange(next: "GENERAL" | "TVET") {
    if (next === area) return;
    const confirmed = window.confirm(
      "Switching the education area will replace the band set with that area's default. Continue?",
    );
    if (!confirmed) return;
    setArea(next);
    setBands(makeDefaultBands(next));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIssues([]);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      ...(mode === "create" ? { educationArea: area } : {}),
      bands: bands.map((b) => ({
        minScore: Number(b.minScore),
        maxScore: Number(b.maxScore),
        symbol: b.symbol.trim(),
        description: b.description.trim() || null,
        points: b.points.trim() === "" ? null : Number(b.points),
        isPass: b.isPass,
      })),
    };

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", payload.name);
      formData.set("description", payload.description ?? "");
      if (mode === "create") formData.set("educationArea", area);
      formData.set("bands", JSON.stringify(payload.bands));

      const result =
        mode === "create"
          ? await createGradeScaleAction(formData)
          : await updateGradeScaleAction(scaleId!, formData);

      if (result.error) {
        setError(result.error);
        setIssues(result.issues ?? []);
        return;
      }

      router.push(LIST_PATH);
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

      {issues.length > 0 && (
        <div
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <p className="font-medium">
            {issues.length} grade band problem{issues.length === 1 ? "" : "s"}:
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {issues.map((issue, i) => (
              <li key={`${issue.path}-${i}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
            Scale Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Secondary Standard"
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>

        {mode === "create" ? (
          <div>
            <label
              htmlFor="educationArea"
              className="block text-sm font-medium text-neutral-700"
            >
              Education Area
            </label>
            <select
              id="educationArea"
              name="educationArea"
              value={area}
              onChange={(e) => handleAreaChange(e.target.value as "GENERAL" | "TVET")}
              className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            >
              <option value="GENERAL">General Education</option>
              <option value="TVET">TVET</option>
            </select>
            <p className="mt-1 text-xs text-neutral-500">
              Only one scale can be active per area.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Education Area
            </label>
            <div className="mt-1 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
              {area === "TVET" ? "TVET" : "General Education"}
              <span className="ml-2 text-xs text-neutral-500">(fixed)</span>
            </div>
          </div>
        )}
      </div>

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
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Any notes about this scale..."
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        />
      </div>

      {/* Bands */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-neutral-900">Grade Bands</h2>
            <p className="text-xs text-neutral-500">
              Bands must cover 0–100 with no overlaps. A one-cent boundary
              (79.99 → 80.00) is treated as contiguous.
            </p>
          </div>
          <button
            type="button"
            onClick={addBand}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Add Band
          </button>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[42rem] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-2 font-medium">Symbol</th>
                <th className="py-2 pr-2 font-medium">Min</th>
                <th className="py-2 pr-2 font-medium">Max</th>
                <th className="py-2 pr-2 font-medium">Points</th>
                <th className="py-2 pr-2 font-medium">Pass</th>
                <th className="py-2 pr-2 font-medium">Description</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {bands.map((band, index) => {
                const protectedSymbol = protectedSymbols.includes(band.symbol.trim());
                return (
                  <tr key={index} className="border-b border-neutral-100">
                    <td className="py-1.5 pr-2">
                      <input
                        aria-label={`Band ${index + 1} symbol`}
                        type="text"
                        value={band.symbol}
                        onChange={(e) =>
                          updateBand(index, { symbol: e.target.value })
                        }
                        disabled={protectedSymbol}
                        className="w-20 rounded-md border border-neutral-300 px-2 py-1.5 text-sm disabled:bg-neutral-100"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        aria-label={`Band ${index + 1} minimum score`}
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={band.minScore}
                        onChange={(e) =>
                          updateBand(index, { minScore: e.target.value })
                        }
                        className="w-24 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        aria-label={`Band ${index + 1} maximum score`}
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={band.maxScore}
                        onChange={(e) =>
                          updateBand(index, { maxScore: e.target.value })
                        }
                        className="w-24 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        aria-label={`Band ${index + 1} points`}
                        type="number"
                        step="0.1"
                        min="0"
                        value={band.points}
                        onChange={(e) =>
                          updateBand(index, { points: e.target.value })
                        }
                        className="w-20 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        aria-label={`Band ${index + 1} counts as pass`}
                        type="checkbox"
                        checked={band.isPass}
                        onChange={(e) =>
                          updateBand(index, { isPass: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        aria-label={`Band ${index + 1} description`}
                        type="text"
                        value={band.description}
                        onChange={(e) =>
                          updateBand(index, { description: e.target.value })
                        }
                        className="w-full min-w-[10rem] rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="py-1.5">
                      <button
                        type="button"
                        onClick={() => removeBand(index)}
                        disabled={bands.length <= 2 || protectedSymbol}
                        title={
                          protectedSymbol
                            ? "This symbol is used on existing report cards."
                            : undefined
                        }
                        className="text-sm text-red-600 hover:text-red-800 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {protectedSymbols.length > 0 && (
          <p className="mt-2 text-xs text-amber-700">
            {protectedSymbols.length} symbol
            {protectedSymbols.length === 1 ? "" : "s"} (
            {protectedSymbols.join(", ")}) appear on existing report cards and
            cannot be removed. Their score ranges can still be adjusted.
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href={LIST_PATH} className="text-sm text-neutral-600 hover:text-neutral-900">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {isPending
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
              ? "Create Grade Scale"
              : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
