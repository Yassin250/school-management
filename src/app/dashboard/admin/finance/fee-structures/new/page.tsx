import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth/session";
import { canForUser } from "@/lib/permissions/can";
import {
  listAcademicYearsForPicker,
  listEducationLevelsForPicker,
  listTradesForPicker,
} from "@/lib/services/finance/fee-structures";
import { FeeStructureForm } from "../fee-form";

export const metadata = {
  title: "New Fee Structure",
};

export default async function NewFeeStructurePage() {
  const user = await requireCurrentUser();

  const canCreate = await canForUser(user, "fee_structures.create");
  if (!canCreate) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-medium text-red-900">Access denied</h1>
        <p className="mt-1 text-sm text-red-700">
          You do not have permission to create fee structures.
        </p>
        <Link
          href="/dashboard/admin/finance/fee-structures"
          className="mt-4 inline-block text-sm font-medium text-red-900 underline"
        >
          Back to fee structures
        </Link>
      </div>
    );
  }

  const [years, levels, trades] = await Promise.all([
    listAcademicYearsForPicker(user),
    listEducationLevelsForPicker(user),
    listTradesForPicker(user),
  ]);

  if (years.length === 0) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/admin/finance/fee-structures"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Back to fee structures
        </Link>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-base font-medium text-amber-900">
            No academic year configured
          </h2>
          <p className="mt-1 text-sm text-amber-700">
            A fee structure requires an academic year. Please configure
            one before creating fees.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/finance/fee-structures"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Back to fee structures
        </Link>
      </div>

      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">
          New Fee Structure
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Define a fee that applies to a specific level or trade for the
          selected academic year.
        </p>
      </header>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <FeeStructureForm
          years={years.map((y) => ({
            id: y.id,
            name: y.name,
            isCurrent: y.isCurrent,
          }))}
          levels={levels.map((l) => ({
            id: l.id,
            code: l.code,
            name: l.name,
            area: l.area,
          }))}
          trades={trades.map((t) => ({
            id: t.id,
            code: t.code,
            name: t.name,
          }))}
        />
      </div>
    </div>
  );
}