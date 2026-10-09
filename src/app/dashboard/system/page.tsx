import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/session";

export default async function SystemDashboardPage() {
  const user = await requireCurrentUser();
  if (!user.roles.includes("SYSTEM_ADMIN")) redirect("/unauthorized");
  return <div><h1 className="text-2xl font-semibold text-neutral-900">System Administration</h1><p className="mt-2 text-sm text-neutral-600">Technical administration for users, roles, permissions, security, configuration, and audit access.</p></div>;
}
