"use server";

import { revalidatePath } from "next/cache";
import {
  listMyNotifications,
  unreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "./list";

export async function getNotificationsStateAction() {
  try {
    const [notifications, unreadCount] = await Promise.all([
      listMyNotifications(15),
      unreadNotificationCount(),
    ]);
    return { notifications, unreadCount };
  } catch {
    return { notifications: [], unreadCount: 0 };
  }
}

export async function markReadAction(notificationId: string) {
  try {
    await markNotificationRead(notificationId);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to mark read.";
    return { error: message };
  }
}

export async function markAllReadAction() {
  try {
    const result = await markAllNotificationsRead();
    revalidatePath("/dashboard");
    return { success: true, count: result.count };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to mark all read.";
    return { error: message };
  }
}
