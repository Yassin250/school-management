// ============================================================
// Notification Read & Manage Service
// ============================================================

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";

export interface NotificationItemView {
  id: string;
  title: string;
  body: string;
  link: string | null;
  createdAt: Date;
  readAt: Date | null;
}

export async function listMyNotifications(
  limit = 20,
): Promise<NotificationItemView[]> {
  const user = await requireCurrentUser();

  const rows = await prisma.notification.findMany({
    where: {
      userId: user.id,
      channel: "IN_APP",
      status: { not: "FAILED" },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      body: true,
      link: true,
      createdAt: true,
      readAt: true,
      metadata: true,
    },
  });

  return rows
    .filter((r) => {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      return !meta.cancelledAt;
    })
    .map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      link: r.link,
      createdAt: r.createdAt,
      readAt: r.readAt,
    }));
}

export async function unreadNotificationCount(): Promise<number> {
  const user = await requireCurrentUser();
  const rows = await prisma.notification.findMany({
    where: {
      userId: user.id,
      channel: "IN_APP",
      status: { not: "FAILED" },
      readAt: null,
    },
    select: { metadata: true },
  });
  return rows.filter((r) => {
    const meta = (r.metadata ?? {}) as Record<string, unknown>;
    return !meta.cancelledAt;
  }).length;
}

export async function markNotificationRead(
  notificationId: string,
): Promise<{ ok: true }> {
  const user = await requireCurrentUser();

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { readAt: new Date(), status: "READ" },
  });

  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<{ ok: true; count: number }> {
  const user = await requireCurrentUser();

  const result = await prisma.notification.updateMany({
    where: {
      userId: user.id,
      readAt: null,
      channel: "IN_APP",
    },
    data: {
      readAt: new Date(),
      status: "READ",
    },
  });

  return { ok: true, count: result.count };
}