import { listMyNotifications } from "@/lib/services/notifications/list";

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toISOString().slice(0, 10);
}

export default async function NotificationsCard() {
  const notifications = await listMyNotifications(10);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-900">Notifications</h2>
        {notifications.length > 0 && (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600">
            {notifications.length}
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">
          No recent notifications.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {notifications.map((n) => {
            const unread = n.readAt === null;
            return (
              <li
                key={n.id}
                className={
                  "rounded-lg border p-3 text-sm " +
                  (unread
                    ? "border-blue-200 bg-blue-50/40"
                    : "border-neutral-200 bg-white")
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900">
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-neutral-600">{n.body}</p>
                  </div>
                  <time className="shrink-0 text-xs text-neutral-400">
                    {formatRelative(n.createdAt)}
                  </time>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}