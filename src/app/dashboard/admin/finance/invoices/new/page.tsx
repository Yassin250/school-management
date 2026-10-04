import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth/session";
import { canForUser } from "@/lib/permissions/can";
import {
  listTermsForPicker,
  listActiveStudentsForTerm,
} from "@/lib/services/finance/invoices";
import { listAcademicYearsForPicker } from "@/lib/services/finance/fee-structures";
import { InvoiceForm } from "../invoice-form";

export const metadata = {
  title: "New Invoice — Finance",
};

export default async function NewInvoicePage() {
  const user = await requireCurrentUser();

  const canCreate = await canForUser(user, "invoices.create");
  if (!canCreate) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-medium text-red-900">Access denied</h1>
        <p className="mt-1 text-sm text-red-700">
          You do not have permission to create invoices.
        </p>
        <Link
          href="/dashboard/admin/finance/invoices"
          className="mt-4 inline-block text-sm font-medium text-red-900 underline"
        >
          Back to invoices
        </Link>
      </div>
    );
  }

  const [years, terms] = await Promise.all([
    listAcademicYearsForPicker(user),
    listTermsForPicker(user),
  ]);

  const currentYear = years.find((y) => y.isCurrent) ?? years[0];

  if (!currentYear) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/admin/finance/invoices"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Back to invoices
        </Link>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-base font-medium text-amber-900">
            No academic year configured
          </h2>
          <p className="mt-1 text-sm text-amber-700">
            An invoice requires an academic year and term. Configure them first.
          </p>
        </div>
      </div>
    );
  }

  // Load active students for the current year
  const enrollments = await listActiveStudentsForTerm(user, currentYear.id);

  const students = enrollments.map((e) => ({
    studentId: e.student.id,
    studentCode: e.student.studentCode,
    firstName: e.student.firstName,
    lastName: e.student.lastName,
    className: e.class.name,
  }));

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

      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Generate Invoice
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Creates one term-scoped invoice for the selected student, using
          all applicable fee structures.
        </p>
      </header>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <InvoiceForm
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
          students={students}
        />
      </div>
    </div>
  );
}