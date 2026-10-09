"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/session";
import {
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  deleteAnnouncement,
} from "@/lib/services/announcements/announcements";
import type { AnnouncementAudience } from "@prisma/client";

export interface SaveAnnouncementState {
  success?: boolean;
  error?: string;
}

export async function saveAnnouncementAction(
  prevState: SaveAnnouncementState | null,
  formData: FormData,
): Promise<SaveAnnouncementState> {
  try {
    const actor = await requireCurrentUser();

    const id = (formData.get("id") as string)?.trim();
    const title = (formData.get("title") as string)?.trim();
    const body = (formData.get("body") as string)?.trim();
    const audience = (formData.get("audience") as AnnouncementAudience) || "ALL";
    const classId = (formData.get("classId") as string)?.trim() || null;
    const isPinned = formData.get("isPinned") === "true" || formData.get("isPinned") === "on";
    const publishImmediately = formData.get("publishImmediately") === "true" || formData.get("publishImmediately") === "on";

    if (!title) return { error: "Title is required." };
    if (!body) return { error: "Announcement body is required." };

    if (id) {
      await updateAnnouncement(actor, id, {
        title,
        body,
        audience,
        classId,
        isPinned,
      });
    } else {
      await createAnnouncement(actor, {
        title,
        body,
        audience,
        classId,
        isPinned,
        publishImmediately,
      });
    }

    revalidatePath("/dashboard/announcements");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save announcement.";
    return { error: message };
  }
}

export async function publishAnnouncementAction(
  id: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const actor = await requireCurrentUser();
    await publishAnnouncement(actor, id);
    revalidatePath("/dashboard/announcements");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to publish announcement.";
    return { error: message };
  }
}

export async function deleteAnnouncementAction(
  id: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const actor = await requireCurrentUser();
    await deleteAnnouncement(actor, id);
    revalidatePath("/dashboard/announcements");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete announcement.";
    return { error: message };
  }
}
