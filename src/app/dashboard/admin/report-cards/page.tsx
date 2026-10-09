import { redirect } from "next/navigation";

// Retained only as a compatibility route; report-card operations live in /admin/reports.
export default function LegacyReportCardsPage() {
  redirect("/dashboard/admin/reports");
}
