import { auth } from "@/auth";
import { redirect } from "next/navigation";

const VALID_ROLES = ["admin", "teacher", "student", "parent"] as const;

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (!role || !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    redirect("/login");
  }

  redirect(`/dashboard/${role}`);
}
