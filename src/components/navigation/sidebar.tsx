import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth/session";
import { canForUser } from "@/lib/permissions/can";
import { NAV_SECTIONS } from "@/lib/navigation/nav-config";
import { NavIcon } from "./nav-icon";

export async function Sidebar() {
  const user = await requireCurrentUser();
  const userRoles = user.roles;

  // Determine which items are visible:
  //   1. User must have one of the item's requiredRoles
  //   2. If requiredPermission is set, user must have it too
  const visibleSections = await Promise.all(
    NAV_SECTIONS.map(async (section) => {
      const visibleItems = await Promise.all(
        section.items.map(async (item) => {
          const roleMatch = item.requiredRoles.some((r) =>
            userRoles.includes(r),
          );
          if (!roleMatch) {
            return { item, visible: false };
          }

          if (item.requiredPermission) {
            const permMatch = await canForUser(
              user,
              item.requiredPermission,
            );
            return { item, visible: permMatch };
          }

          return { item, visible: true };
        }),
      );

      return {
        ...section,
        items: visibleItems.filter((x) => x.visible).map((x) => x.item),
      };
    }),
  );

  const sections = visibleSections.filter((s) => s.items.length > 0);

  if (sections.length === 0) return null;

  return (
    <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white md:block">
      <nav className="p-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-6">
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {section.label}
            </h3>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    <NavIcon name={item.icon} className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}