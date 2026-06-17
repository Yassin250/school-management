"use server";

import { logAudit } from "@/lib/audit";
import { actionSuccess, type ActionResult } from "@/lib/actions/types";
import { withPermission } from "@/lib/actions/helpers";
import { eventSchema, type EventFormData } from "@/lib/formValidation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const EVENTS_PATH = "/dashboard/admin/list/events";

export async function createEvent(
  data: EventFormData
): Promise<ActionResult<Awaited<ReturnType<typeof prisma.event.create>>>> {
  return withPermission("event:manage", async ({ userId }) => {
    const validated = eventSchema.parse(data);

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

    await logAudit({
      userId,
      action: "CREATE",
      entity: "Event",
      entityId: String(event.id),
      description: `Created event ${event.title}`,
    });

    revalidatePath(EVENTS_PATH);
    return actionSuccess(event);
  }, "Failed to create event");
}

export async function updateEvent(
  id: number,
  data: EventFormData
): Promise<ActionResult<Awaited<ReturnType<typeof prisma.event.update>>>> {
  return withPermission("event:manage", async ({ userId }) => {
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

    await logAudit({
      userId,
      action: "UPDATE",
      entity: "Event",
      entityId: String(id),
      description: `Updated event ${event.title}`,
    });

    revalidatePath(EVENTS_PATH);
    revalidatePath(`${EVENTS_PATH}/${id}`);
    revalidatePath(`${EVENTS_PATH}/${id}/edit`);
    return actionSuccess(event);
  }, "Failed to update event");
}

export async function deleteEvent(id: number): Promise<ActionResult<void>> {
  return withPermission("event:manage", async ({ userId }) => {
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    await prisma.event.delete({ where: { id } });

    await logAudit({
      userId,
      action: "DELETE",
      entity: "Event",
      entityId: String(id),
      description: `Deleted event ${event.title}`,
    });

    revalidatePath(EVENTS_PATH);
    return actionSuccess();
  }, "Failed to delete event");
}
