import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth/session";
import { canForUser } from "@/lib/permissions/can";
import {
  listInvoices,
  listTermsForPicker,
} from "@/lib/services/finance/invoices";

export const metadata = {
  title: "Invoices — Finance",
};

export default async function InvoicesPage() {
  const user = await requireCurrentUser();

  const canRead = await canForUser(user, "invoices.read");
  if (!canRead) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-medium text-red-900">Access denied</h1>
        <p className="mt-1 text-sm text-red-700">
          You do not have permission to view invoices.
        </p>
      </div>
    );
  }

  const canCreate = await canForUser(user, "invoices.create");

  const [invoices, terms] = await Promise.all([
    listInvoices(user),
    listTermsForPicker(user),
  ]);

  const currentTerm = terms.find((t) => t.isCurrent);

  // Group counts for the pill row
  const draftCount = invoices.filter((i) => i.status === "DRAFT").length;
  const issuedCount = invoices.filter((i) => i.status === "ISSUED").length;
  const paidCount = invoices.filter((i) => i.status === "PAID").length;

  const totalOutstanding = invoices.reduce((sum, i) => {
    if (i.status === "CANCELLED") return sum;
    return sum + Number(i.balance);
  }, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Student Invoices
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Term-scoped fee invoices for students.
          </p>
        </div>

        {canCreate && (
          <Link
            href="/dashboard/admin/finance/invoices/new"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            + New Invoice
          </Link>
        )}
      </header>

      {/* Current term pill */}
      {currentTerm && (
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>
            {currentTerm.academicYear.name} • {currentTerm.name} (current)
          </span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total" value={invoices.length.toString()} />
        <SummaryCard label="Draft" value={draftCount.toString()} />
        <SummaryCard label="Issued" value={issuedCount.toString()} />
        <SummaryCard label="Paid" value={paidCount.toString()} />
      </div>

      {/* Outstanding total */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wider text-amber-700">
          Total Outstanding
        </span>
        <div className="mt-1 font-mono text-2xl font-bold text-amber-900">
          {totalOutstanding.toLocaleString("en-RW")} RWF
        </div>
      </div>

      {/* Table */}
      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-medium text-neutral-900">
            All Invoices ({invoices.length})
          </h2>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-neutral-500">
              No invoices have been generated yet.
            </p>
            {canCreate && (
              <Link
                href="/dashboard/admin/finance/invoices/new"
                className="mt-4 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Create the first invoice
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
              <tr>
                <th className="px-6 py-3">Invoice #</th>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Class</th>
                <th className="px-6 py-3">Term</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3 text-right">Balance</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-6 py-3">
                    <Link
                      href={`/dashboard/admin/finance/invoices/${inv.id}`}
                      className="font-mono text-xs font-medium text-neutral-900 hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-neutral-900">
                    {inv.studentName}
                  </td>
                  <td className="px-6 py-3 text-neutral-600">
                    {inv.className}
                  </td>
                  <td className="px-6 py-3 text-neutral-600">
                    {inv.termName}
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-neutral-900">
                    {Number(inv.totalAmount).toLocaleString("en-RW")}
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-neutral-900">
                    {Number(inv.balance).toLocaleString("en-RW")}
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={inv.status} />
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-neutral-900">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-neutral-100 text-neutral-700",
    ISSUED: "bg-blue-50 text-blue-700",
    PARTIALLY_PAID: "bg-amber-50 text-amber-700",
    PAID: "bg-emerald-50 text-emerald-700",
    OVERDUE: "bg-red-50 text-red-700",
    CANCELLED: "bg-neutral-200 text-neutral-500",
  };
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.DRAFT}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}