import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/session";
import { canForUser } from "@/lib/permissions/can";
import { getInvoiceDetail } from "@/lib/services/finance/invoices";
import {
  listPaymentsForInvoice,
  listParentsForStudent,
} from "@/lib/services/finance/payments";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import { InvoiceActions } from "./invoice-actions";
import { PaymentForm } from "./payment-form";

interface PageProps {
  params: Promise<{ invoiceId: string }>;
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { invoiceId } = await params;
  const user = await requireCurrentUser();

    let invoice;
  try {
    invoice = await getInvoiceDetail(user, invoiceId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof ForbiddenError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">
            You do not have access to this invoice.
          </p>
        </div>
      );
    }
    throw error;
  }

  const canIssue = await canForUser(user, "invoices.update");
  const canCancel = await canForUser(user, "invoices.cancel");
  const canRecordPayment = await canForUser(user, "payments.create");

  const [payments, parents] = await Promise.all([
    listPaymentsForInvoice(user, invoiceId),
         canRecordPayment
      ? listParentsForStudent(user, invoice.student.id)
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/finance/invoices"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Back to invoices
        </Link>
      </div>

      {/* Header */}
      <header className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold text-neutral-900">
                {invoice.invoiceNumber}
              </h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="mt-1 text-sm text-neutral-600">
              {invoice.student.firstName} {invoice.student.lastName} (
              {invoice.student.studentCode}) • {invoice.class.name}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {invoice.academicYear.name} • {invoice.term.name}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-600">
          <span>
            Issued:{" "}
            <strong className="text-neutral-900">
              {invoice.issueDate.toISOString().slice(0, 10)}
            </strong>
          </span>
          <span>
            Due:{" "}
            <strong className="text-neutral-900">
              {invoice.dueDate.toISOString().slice(0, 10)}
            </strong>
          </span>
        </div>

        {invoice.notes && (
          <div className="mt-4 rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
            {invoice.notes}
          </div>
        )}
      </header>

      {/* Line items */}
      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-medium text-neutral-900">
            Line Items ({invoice.items.length})
          </h2>
        </div>

        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
            <tr>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3 text-right">Amount (RWF)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-neutral-100 last:border-0"
              >
                <td className="px-6 py-3 text-neutral-900">
                  {item.description}
                </td>
                <td className="px-6 py-3 text-right font-mono text-neutral-900">
                  {Number(item.amount).toLocaleString("en-RW")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

            {/* Payment history */}
      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-medium text-neutral-900">
            Payment History ({payments.length})
          </h2>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            No payments recorded yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
              <tr>
                <th className="px-6 py-3">Payment #</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">Reference</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-neutral-100 last:border-0"
                >
                  <td className="px-6 py-3 font-mono text-xs font-medium text-neutral-900">
                    {p.paymentNumber}
                  </td>
                  <td className="px-6 py-3 text-neutral-600">
                    {p.paidAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-6 py-3 text-neutral-600">
                    {p.method.replace(/_/g, " ")}
                  </td>
                  <td className="px-6 py-3 text-neutral-500">
                    {p.reference ?? "-"}
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-emerald-700">
                    + {Number(p.amount).toLocaleString("en-RW")}
                  </td>
                </tr>
              ))}
              <tr className="bg-neutral-50 font-semibold">
                <td
                  colSpan={4}
                  className="px-6 py-3 text-right text-neutral-900"
                >
                  Total Paid
                </td>
                <td className="px-6 py-3 text-right font-mono text-neutral-900">
                  {Number(invoice.paidAmount).toLocaleString("en-RW")}
                </td>
              </tr>
              <tr className="bg-amber-50">
                <td
                  colSpan={4}
                  className="px-6 py-3 text-right font-semibold text-amber-900"
                >
                  Remaining Balance
                </td>
                <td className="px-6 py-3 text-right font-mono font-bold text-amber-900">
                  {Number(invoice.balance).toLocaleString("en-RW")}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </section>

      {/* Payment form — shown only if user can create payments and invoice has balance */}
      {canRecordPayment &&
        Number(invoice.balance) > 0 &&
        invoice.status !== "CANCELLED" &&
        invoice.status !== "DRAFT" && (
          <PaymentForm
            invoiceId={invoice.id}
            remainingBalance={invoice.balance}
            parents={parents.map((p) => ({
              id: p.id,
              firstName: p.firstName,
              lastName: p.lastName,
              phone: p.phone,
              relationship: p.relationship,
              isPrimary: p.isPrimary,
            }))}
          />
        )}

      {/* Actions */}
      {(canIssue || canCancel) &&
        (invoice.status === "DRAFT" || invoice.status === "ISSUED") && (
          <InvoiceActions
            invoiceId={invoice.id}
            status={invoice.status}
            canIssue={canIssue}
            canCancel={canCancel}
          />
        )}
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
      className={`rounded-md px-3 py-1 text-xs font-medium ${styles[status] ?? styles.DRAFT}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}