// src/lib/actions/event.ts
"use server";

import { prisma } from "@/lib/prisma";
import {
  eventSchema,
  type EventFormData,
} from "@/lib/formValidation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const EVENTS_PATH = "/dashboard/admin/list/events";

export async function createEvent(data: EventFormData) {
  try {
    const validated = eventSchema.parse(data);

    // Validate class if provided
    if (validated.classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: Number(validated.classId) },
      });
      if (!classExists) {
        return { success: false, error: "Selected class does not exist" };
      }
    }

    const event = await prisma.event.create({
      data: {
        title: validated.title,
        description: validated.description,
        startTime: new Date(validated.startTime),
        endTime: new Date(validated.endTime),
        classId: validated.classId ? Number(validated.classId) : null,
      },
      include: {
        class: {
          select: { id: true, name: true },
        },
      },
    });

    revalidatePath(EVENTS_PATH);
    return { success: true, data: event };
  } catch (error) {
    console.error("Create event error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to create event" };
  }
}

export async function updateEvent(id: number, data: EventFormData) {
  try {
    const validated = eventSchema.parse(data);

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Event not found" };
    }

    if (validated.classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: Number(validated.classId) },
      });
      if (!classExists) {
        return { success: false, error: "Selected class does not exist" };
      }
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title: validated.title,
        description: validated.description,
        startTime: new Date(validated.startTime),
        endTime: new Date(validated.endTime),
        classId: validated.classId ? Number(validated.classId) : null,
      },
      include: {
        class: {
          select: { id: true, name: true },
        },
      },
    });

    revalidatePath(EVENTS_PATH);
    revalidatePath(`${EVENTS_PATH}/${id}`);
    revalidatePath(`${EVENTS_PATH}/${id}/edit`);
    return { success: true, data: event };
  } catch (error) {
    console.error("Update event error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid form data" };
    }
    return { success: false, error: "Failed to update event" };
  }
}

export async function deleteEvent(id: number) {
  try {
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    await prisma.event.delete({ where: { id } });

    revalidatePath(EVENTS_PATH);
    return { success: true };
  } catch (error) {
    console.error("Delete event error:", error);
    return {
      success: false,
      error: "Failed to delete event.",
    };
  }
}