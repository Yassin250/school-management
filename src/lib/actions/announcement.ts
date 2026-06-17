"use server";

import { logAudit } from "@/lib/audit";
import { actionSuccess, type ActionResult } from "@/lib/actions/types";
import { withPermission } from "@/lib/actions/helpers";
import {
  announcementSchema,
  type AnnouncementFormData,
} from "@/lib/formValidation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const ANNOUNCEMENTS_PATH = "/dashboard/admin/list/announcements";

export async function createAnnouncement(
  data: AnnouncementFormData
): Promise<ActionResult<Awaited<ReturnType<typeof prisma.announcement.create>>>> {
  return withPermission("announcement:manage", async ({ userId }) => {
    const validated = announcementSchema.parse(data);

    if (validated.classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: Number(validated.classId) },
      });
      if (!classExists) {
        return { success: false, error: "Selected class does not exist" };
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: validated.title,
        description: validated.description,
        date: new Date(validated.date),
        classId: validated.classId ? Number(validated.classId) : null,
      },
      include: {
        class: { select: { name: true } },
      },
    });

    await logAudit({
      userId,
      action: "CREATE",
      entity: "Announcement",
      entityId: String(announcement.id),
      description: `Created announcement ${announcement.title}`,
    });

    revalidatePath(ANNOUNCEMENTS_PATH);
    return actionSuccess(announcement);
  }, "Failed to create announcement");
}

export async function updateAnnouncement(
  id: number,
  data: AnnouncementFormData
): Promise<ActionResult<Awaited<ReturnType<typeof prisma.announcement.update>>>> {
  return withPermission("announcement:manage", async ({ userId }) => {
    const validated = announcementSchema.parse(data);

    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Announcement not found" };
    }

    if (validated.classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: Number(validated.classId) },
      });
      if (!classExists) {
        return { success: false, error: "Selected class does not exist" };
      }
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        title: validated.title,
        description: validated.description,
        date: new Date(validated.date),
        classId: validated.classId ? Number(validated.classId) : null,
      },
      include: {
        class: { select: { name: true } },
      },
    });

    await logAudit({
      userId,
      action: "UPDATE",
      entity: "Announcement",
      entityId: String(id),
      description: `Updated announcement ${announcement.title}`,
    });

    revalidatePath(ANNOUNCEMENTS_PATH);
    revalidatePath(`${ANNOUNCEMENTS_PATH}/${id}`);
    revalidatePath(`${ANNOUNCEMENTS_PATH}/${id}/edit`);
    return actionSuccess(announcement);
  }, "Failed to update announcement");
}

export async function deleteAnnouncement(
  id: number
): Promise<ActionResult<void>> {
  return withPermission("announcement:manage", async ({ userId }) => {
    const announcement = await prisma.announcement.findUnique({ where: { id } });

    if (!announcement) {
      return { success: false, error: "Announcement not found" };
    }

    await prisma.announcement.delete({ where: { id } });

    await logAudit({
      userId,
      action: "DELETE",
      entity: "Announcement",
      entityId: String(id),
      description: `Deleted announcement ${announcement.title}`,
    });

    revalidatePath(ANNOUNCEMENTS_PATH);
    return actionSuccess();
  }, "Failed to delete announcement");
}
