// src/lib/actions/announcement.ts
"use server";

import { prisma } from "@/lib/prisma";
import {
  announcementSchema,
  type AnnouncementFormData,
} from "@/lib/formValidation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ANNOUNCEMENTS_PATH = "/dashboard/admin/list/announcements";

export async function createAnnouncement(data: AnnouncementFormData) {
  try {
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

    revalidatePath(ANNOUNCEMENTS_PATH);
    return { success: true, data: announcement };
  } catch (error) {
    console.error("Create announcement error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to create announcement" };
  }
}

export async function updateAnnouncement(id: number, data: AnnouncementFormData) {
  try {
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

    revalidatePath(ANNOUNCEMENTS_PATH);
    revalidatePath(`${ANNOUNCEMENTS_PATH}/${id}`);
    revalidatePath(`${ANNOUNCEMENTS_PATH}/${id}/edit`);
    return { success: true, data: announcement };
  } catch (error) {
    console.error("Update announcement error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to update announcement" };
  }
}

export async function deleteAnnouncement(id: number) {
  try {
    const announcement = await prisma.announcement.findUnique({ where: { id } });

    if (!announcement) {
      return { success: false, error: "Announcement not found" };
    }

    await prisma.announcement.delete({ where: { id } });

    revalidatePath(ANNOUNCEMENTS_PATH);
    return { success: true };
  } catch (error) {
    console.error("Delete announcement error:", error);
    return { success: false, error: "Failed to delete announcement." };
  }
}