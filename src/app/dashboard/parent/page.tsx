import { getCurrentUser } from "@/lib/auth/session";

export default async function ParentDashboard() {
  const user = await getCurrentUser();
  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Parent Dashboard
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        Welcome, {user?.email}
      </p>
      <p className="mt-1 text-sm text-neutral-600">
        Roles: {user?.roles.join(", ")}
      </p>
      <p className="mt-6 text-sm text-neutral-500">
        Your dashboard is ready.
      </p>
    </div>
  );
}