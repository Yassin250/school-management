"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveMarksAction } from "./actions";
import type { StudentMarkRow } from "@/lib/services/teacher/assessment-detail";

interface Props {
  assessmentId: string;
  maxScore: string;
  editable: boolean;
  initialStudents: StudentMarkRow[];
}

interface RowState {
  studentId: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  score: string;
  isAbsent: boolean;
  note: string;
}

export function MarkEntryForm({
  assessmentId,
  maxScore,
  editable,
  initialStudents,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [rows, setRows] = useState<RowState[]>(
    initialStudents.map((s) => ({
      studentId: s.studentId,
      studentCode: s.studentCode,
      firstName: s.firstName,
      lastName: s.lastName,
      score: s.score ?? "",
      isAbsent: s.isAbsent,
      note: s.note ?? "",
    })),
  );

  function updateScore(studentId: string, value: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.studentId === studentId ? { ...r, score: value, isAbsent: false } : r,
      ),
    );
    setSuccess(false);
  }

  function toggleAbsent(studentId: string, isAbsent: boolean) {
    setRows((prev) =>
      prev.map((r) =>
        r.studentId === studentId
          ? { ...r, isAbsent, score: isAbsent ? "" : r.score }
          : r,
      ),
    );
    setSuccess(false);
  }

  function updateNote(studentId: string, note: string) {
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, note } : r)),
    );
    setSuccess(false);
  }

  function handleSave() {
    setError(null);
    setSuccess(false);

    // Client-side validation
    const max = Number(maxScore);
    for (const r of rows) {
      if (r.isAbsent) continue;
      if (r.score.trim() === "") continue; // allow partial save
      const num = Number(r.score);
      if (!Number.isFinite(num) || num < 0 || num > max) {
        setError(
          `Invalid score for ${r.firstName} ${r.lastName}: must be between 0 and ${max}.`,
        );
        return;
      }
    }

    const payload = rows.map((r) => ({
      studentId: r.studentId,
      score: r.isAbsent || r.score.trim() === "" ? null : Number(r.score),
      isAbsent: r.isAbsent,
      note: r.note.trim() === "" ? undefined : r.note.trim(),
    }));

    startTransition(async () => {
      const result = await saveMarksAction(assessmentId, JSON.stringify(payload));

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
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
          className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          Marks saved.
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
            <tr>
              <th className="px-6 py-3">Code</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3 w-32">Score</th>
              <th className="px-6 py-3 w-24">Absent</th>
              <th className="px-6 py-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.studentId}
                className="border-b border-neutral-100 last:border-0"
              >
                <td className="px-6 py-3 font-mono text-xs text-neutral-500">
                  {r.studentCode}
                </td>
                <td className="px-6 py-3 text-neutral-900">
                  {r.lastName} {r.firstName}
                </td>
                <td className="px-6 py-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={maxScore}
                    value={r.score}
                    onChange={(e) => updateScore(r.studentId, e.target.value)}
                    disabled={!editable || r.isAbsent}
                    className="block w-full rounded-md border border-neutral-300 px-2 py-1 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-100"
                    placeholder="-"
                  />
                </td>
                <td className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={r.isAbsent}
                    onChange={(e) =>
                      toggleAbsent(r.studentId, e.target.checked)
                    }
                    disabled={!editable}
                    className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                </td>
                <td className="px-6 py-3">
                  <input
                    type="text"
                    value={r.note}
                    onChange={(e) => updateNote(r.studentId, e.target.value)}
                    disabled={!editable}
                    className="block w-full rounded-md border border-neutral-300 px-2 py-1 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-100"
                    placeholder="Optional"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editable && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save Marks"}
          </button>
        </div>
      )}

      {!editable && (
        <p className="text-sm text-neutral-500">
          This assessment is <strong>{assessmentId ? "" : ""}</strong>
          in a state that does not allow editing marks.
        </p>
      )}
    </div>
  );
}