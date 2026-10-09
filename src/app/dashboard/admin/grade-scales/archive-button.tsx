"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  activateGradeScaleAction,
  archiveGradeScaleAction,
} from "./actions";

interface Props {
  scaleId: string;
  scaleName: string;
  isActive: boolean;
}

export function ScaleActionsButton({
  scaleId,
  scaleName,
  isActive,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: (id: string) => Promise<{ error?: string }>, confirmText: string) {
    const confirmed = window.confirm(confirmText);
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await action(scaleId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (isActive) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() =>
            run(
              archiveGradeScaleAction,
              `Archive "${scaleName}"? It will stop being used for new report cards. ` +
                `Existing report cards keep the grades they were generated with.`,
            )
          }
          disabled={isPending}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
        >
          {isPending ? "Working..." : "Archive"}
        </button>
        {error && (
          <span role="alert" className="max-w-[16rem] text-xs text-red-600">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() =>
          run(
            activateGradeScaleAction,
            `Make "${scaleName}" the active scale? Any currently active scale for ` +
              `this education area will be replaced. Existing report cards keep ` +
              `the grades they were generated with.`,
          )
        }
        disabled={isPending}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
      >
        {isPending ? "Working..." : "Make Active"}
      </button>
      {error && (
        <span role="alert" className="max-w-[16rem] text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}
