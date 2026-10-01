import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { TopNavbar } from "@/components/navigation/top-navbar";
import { Sidebar } from "@/components/navigation/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      {/* Top Navbar */}
      <TopNavbar
        user={{
          email: user.email,
          username: user.username,
          roles: user.roles,
        }}
      />

      {/* Main Container with Sidebar */}
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <Sidebar roles={user.roles} />

        <main className="flex-1 p-6 sm:p-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}