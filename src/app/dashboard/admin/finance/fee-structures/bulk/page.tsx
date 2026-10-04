import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth/session";
import { canForUser } from "@/lib/permissions/can";
import {
  listAcademicYearsForPicker,
  listEducationLevelsForPicker,
  listTradesForPicker,
} from "@/lib/services/finance/fee-structures";
import { listTermsForPicker } from "@/lib/services/finance/invoices";
import { BulkFeeForm } from "../bulk-form";

export const metadata = {
  title: "Bulk Create Fee Structures",
};

export default async function BulkFeeStructuresPage() {
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

  const [years, terms, levels, trades] = await Promise.all([
    listAcademicYearsForPicker(user),
    listTermsForPicker(user),
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
            Please configure an academic year and term before creating fees.
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
          Bulk Create Fee Structures
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Set up the same fee across multiple levels or trades at once.
          Useful for tuition fees that scale with grade level.
        </p>
      </header>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <BulkFeeForm
          years={years.map((y) => ({
            id: y.id,
            name: y.name,
            isCurrent: y.isCurrent,
          }))}
          terms={terms.map((t) => ({
            id: t.id,
            name: t.name,
            academicYearId: t.academicYearId,
            academicYearName: t.academicYear.name,
            isCurrent: t.isCurrent,
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