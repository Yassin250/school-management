import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

// Map roles to their dashboard route.
// This is NAVIGATION, not authorization.
const ROLE_DASHBOARD: Record<string, string> = {
  SYSTEM_ADMIN: "/dashboard/admin",
  SCHOOL_ADMIN: "/dashboard/admin",
  PRINCIPAL: "/dashboard/principal",
  TEACHER: "/dashboard/teacher",
  ACCOUNTANT: "/dashboard/accountant",
  REGISTRAR: "/dashboard/registrar",
  PARENT: "/dashboard/parent",
  STUDENT: "/dashboard/student",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Use the first role that has a mapping
  for (const role of user.roles) {
    const target = ROLE_DASHBOARD[role];
    if (target) redirect(target);
  }

  // No recognized role -> access denied
  redirect("/unauthorized");
}