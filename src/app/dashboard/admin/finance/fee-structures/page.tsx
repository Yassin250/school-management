import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth/session";
import { canForUser } from "@/lib/permissions/can";
import {
  listFeeStructures,
  listAcademicYearsForPicker,
} from "@/lib/services/finance/fee-structures";

export const metadata = {
  title: "Fee Structures — Finance",
};

export default async function FeeStructuresPage() {
  const user = await requireCurrentUser();

  const canRead = await canForUser(user, "fee_structures.read");
  if (!canRead) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-medium text-red-900">Access denied</h1>
        <p className="mt-1 text-sm text-red-700">
          You do not have permission to view fee structures.
        </p>
      </div>
    );
  }

  const canCreate = await canForUser(user, "fee_structures.create");

  const [years, feeStructures] = await Promise.all([
    listAcademicYearsForPicker(user),
    listFeeStructures(user, { includeInactive: false }),
  ]);

  const currentYear = years.find((y) => y.isCurrent) ?? years[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Fee Structures
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Configure fees per academic year and education level or trade.
          </p>
        </div>

        {canCreate && (
          <Link
            href="/dashboard/admin/finance/fee-structures/new"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            + New Fee Structure
          </Link>
        )}
      </header>

      {/* Active year pill */}
      {currentYear && (
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>
            {currentYear.name} {currentYear.isCurrent ? "(current)" : ""}
          </span>
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-medium text-neutral-900">
            All Fee Structures ({feeStructures.length})
          </h2>
        </div>

        {feeStructures.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-neutral-500">
              No fee structures defined yet.
            </p>
            {canCreate && (
              <Link
                href="/dashboard/admin/finance/fee-structures/new"
                className="mt-4 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Create the first one
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Applies To</th>
                <th className="px-6 py-3">Year</th>
                <th className="px-6 py-3 text-right">Amount (RWF)</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {feeStructures.map((fs) => (
                <tr
                  key={fs.id}
                  className="border-b border-neutral-100 last:border-0"
                >
                  <td className="px-6 py-3 text-neutral-900">
                    <div className="font-medium">{fs.name}</div>
                    {!fs.isMandatory && (
                      <span className="mt-0.5 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        Optional
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-neutral-600">
                    {fs.feeType.replace(/_/g, " ")}
                  </td>
                  <td className="px-6 py-3 text-neutral-600">
                    {fs.educationLevelName ??
                      fs.tradeName ??
                      "-"}
                  </td>
                  <td className="px-6 py-3 text-neutral-600">
                    {fs.academicYearName}
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-neutral-900">
                    {Number(fs.amount).toLocaleString("en-RW")}
                  </td>
                  <td className="px-6 py-3">
                    {fs.isActive ? (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                        Archived
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}