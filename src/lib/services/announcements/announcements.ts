// ============================================================
// Announcements Service
// Multi-audience broadcast & school communications
// ============================================================

import { prisma } from "@/lib/prisma";
import { canForUser } from "@/lib/permissions/can";
import { logAudit } from "@/lib/audit/audit";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import type { CurrentUser } from "@/lib/auth/session";
import type { AnnouncementAudience, Prisma } from "@prisma/client";

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  classId?: string | null;
  isPinned?: boolean;
  publishImmediately?: boolean;
  expiresAt?: Date | null;
}

export interface UpdateAnnouncementInput {
  title?: string;
  body?: string;
  audience?: AnnouncementAudience;
  classId?: string | null;
  isPinned?: boolean;
  expiresAt?: Date | null;
}

export interface AnnouncementListItem {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  classId: string | null;
  className?: string;
  authorId: string;
  authorName: string;
  publishedAt: Date | null;
  expiresAt: Date | null;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  canEdit: boolean;
}

// ------------------------------------------------------------
// Helper: Send in-app notifications on publish
// ------------------------------------------------------------

async function broadcastAnnouncementNotifications(
  tx: Prisma.TransactionClient,
  announcement: {
    id: string;
    title: string;
    audience: AnnouncementAudience;
    classId: string | null;
  },
) {
  let targetUserIds: string[] = [];

  switch (announcement.audience) {
    case "ALL": {
      const users = await tx.user.findMany({
        where: { status: "ACTIVE" },
        select: { id: true },
      });
      targetUserIds = users.map((u) => u.id);
      break;
    }
    case "STUDENTS": {
      const students = await tx.student.findMany({
        where: { status: "ACTIVE", userId: { not: null } },
        select: { userId: true },
      });
      targetUserIds = students.map((s) => s.userId!).filter(Boolean);
      break;
    }
    case "PARENTS": {
      const parents = await tx.parent.findMany({
        where: { userId: { not: null } },
        select: { userId: true },
      });
      targetUserIds = parents.map((p) => p.userId!).filter(Boolean);
      break;
    }
    case "TEACHERS": {
      const teachers = await tx.teacher.findMany({
        where: { status: "ACTIVE" },
        select: { userId: true },
      });
      targetUserIds = teachers.map((t) => t.userId);
      break;
    }
    case "STAFF": {
      const staffUsers = await tx.user.findMany({
        where: {
          status: "ACTIVE",
          roles: {
            some: {
              role: {
                key: {
                  in: [
                    "SYSTEM_ADMIN",
                    "SCHOOL_ADMIN",
                    "PRINCIPAL",
                    "ACCOUNTANT",
                    "TEACHER",
                  ],
                },
              },
            },
          },
        },
        select: { id: true },
      });
      targetUserIds = staffUsers.map((u) => u.id);
      break;
    }
    case "CLASS": {
      if (!announcement.classId) break;
      // Get enrolled students & their parents
      const [enrollments, teachers] = await Promise.all([
        tx.enrollment.findMany({
          where: { classId: announcement.classId, status: "ACTIVE" },
          include: {
            student: {
              select: {
                userId: true,
                parentLinks: { select: { parent: { select: { userId: true } } } },
              },
            },
          },
        }),
        tx.teacherAssignment.findMany({
          where: { classId: announcement.classId },
          include: { teacher: { select: { userId: true } } },
        }),
      ]);

      const ids = new Set<string>();
      for (const e of enrollments) {
        if (e.student.userId) ids.add(e.student.userId);
        for (const pl of e.student.parentLinks) {
          if (pl.parent.userId) ids.add(pl.parent.userId);
        }
      }
      for (const t of teachers) {
        if (t.teacher.userId) ids.add(t.teacher.userId);
      }
      targetUserIds = Array.from(ids);
      break;
    }
  }

  if (targetUserIds.length === 0) return;

  // Batch insert notifications
  const data = targetUserIds.map((userId) => ({
    userId,
    channel: "IN_APP" as const,
    status: "PENDING" as const,
    title: `📢 Announcement: ${announcement.title}`,
    body: announcement.title,
    link: "/dashboard/announcements",
    metadata: { announcementId: announcement.id, audience: announcement.audience },
  }));

  await tx.notification.createMany({
    data,
    skipDuplicates: true,
  });
}

function isAnnouncementAdministrator(actor: CurrentUser) {
  return actor.roles.includes("SYSTEM_ADMIN") || actor.roles.includes("SCHOOL_ADMIN") || actor.roles.includes("PRINCIPAL");
}

async function assertTeacherClassAudience(
  actor: CurrentUser,
  audience: AnnouncementAudience,
  classId: string | null | undefined,
) {
  if (!actor.roles.includes("TEACHER") || isAnnouncementAdministrator(actor)) return;
  if (audience !== "CLASS" || !classId) {
    throw new ValidationError("Teachers may publish announcements only to an assigned class.");
  }
  if (!actor.teacherId) throw new ForbiddenError("announcements.create");
  const assignment = await prisma.teacherAssignment.findFirst({
    where: { teacherId: actor.teacherId, classId }, select: { id: true },
  });
  if (!assignment) throw new ForbiddenError("announcements.create");
}

// ------------------------------------------------------------
// 1. List Announcements
// ------------------------------------------------------------

export async function listAnnouncements(
  actor: CurrentUser,
  options?: {
    audience?: AnnouncementAudience;
    classId?: string;
    includeDrafts?: boolean;
  },
): Promise<AnnouncementListItem[]> {
  const allowed = await canForUser(actor, "announcements.read");
  if (!allowed) throw new ForbiddenError("announcements.read");

  const isStaffAdmin = isAnnouncementAdministrator(actor);

  const canEditGlobal = await canForUser(actor, "announcements.create");

  // Determine audience filters based on role
  let audienceFilter: Prisma.AnnouncementWhereInput;

  if (isStaffAdmin) {
    audienceFilter = {};
  } else if (actor.roles.includes("TEACHER")) {
    const assignedClasses = actor.teacherId
      ? await prisma.teacherAssignment.findMany({
          where: { teacherId: actor.teacherId },
          select: { classId: true },
        })
      : [];
    const classIds = assignedClasses.map((a) => a.classId);

    audienceFilter = {
      OR: [
        { audience: "ALL" },
        { audience: "STAFF" },
        { audience: "TEACHERS" },
        { audience: "CLASS", classId: { in: classIds } },
        { authorId: actor.id },
      ],
    };
  } else if (actor.roles.includes("STUDENT")) {
    const enrollment = actor.studentId
      ? await prisma.enrollment.findFirst({
          where: { studentId: actor.studentId, status: "ACTIVE" },
          select: { classId: true },
        })
      : null;

    audienceFilter = {
      OR: [
        { audience: "ALL" },
        { audience: "STUDENTS" },
        ...(enrollment ? [{ audience: "CLASS" as const, classId: enrollment.classId }] : []),
      ],
    };
  } else if (actor.roles.includes("PARENT")) {
    const children = actor.parentId
      ? await prisma.parentStudent.findMany({
          where: { parentId: actor.parentId },
          include: {
            student: {
              include: {
                enrollments: { where: { status: "ACTIVE" }, select: { classId: true } },
              },
            },
          },
        })
      : [];

    const classIds = children.flatMap((c) => c.student.enrollments.map((e) => e.classId));

    audienceFilter = {
      OR: [
        { audience: "ALL" },
        { audience: "PARENTS" },
        ...(classIds.length > 0 ? [{ audience: "CLASS" as const, classId: { in: classIds } }] : []),
      ],
    };
  } else {
    audienceFilter = { audience: "ALL" };
  }

  // Published vs draft filters
  const where: Prisma.AnnouncementWhereInput = {
    ...audienceFilter,
    ...(options?.audience ? { audience: options.audience } : {}),
    ...(options?.classId ? { classId: options.classId } : {}),
    ...(!isStaffAdmin
      ? {
          OR: [
            { publishedAt: { not: null } },
            { authorId: actor.id },
          ],
        }
      : options?.includeDrafts === false
        ? { publishedAt: { not: null } }
        : {}),
  };

  const rows = await prisma.announcement.findMany({
    where,
    include: {
      author: { select: { id: true, username: true } },
      class: { select: { id: true, name: true } },
    },
    orderBy: [
      { isPinned: "desc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    audience: r.audience,
    classId: r.classId,
    className: r.class?.name,
    authorId: r.authorId,
    authorName: r.author.username,
    publishedAt: r.publishedAt,
    expiresAt: r.expiresAt,
    isPinned: r.isPinned,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    canEdit: canEditGlobal || r.authorId === actor.id,
  }));
}

// ------------------------------------------------------------
// 2. Create Announcement
// ------------------------------------------------------------

export async function createAnnouncement(
  actor: CurrentUser,
  input: CreateAnnouncementInput,
) {
  const allowed = await canForUser(actor, "announcements.create");
  if (!allowed) throw new ForbiddenError("announcements.create");

  const title = input.title.trim();
  const body = input.body.trim();

  if (!title) throw new ValidationError("Announcement title is required.");
  if (!body) throw new ValidationError("Announcement body is required.");

  if (input.audience === "CLASS" && !input.classId) {
    throw new ValidationError("Target class is required when audience is CLASS.");
  }
  await assertTeacherClassAudience(actor, input.audience, input.classId);

  const publishedAt = input.publishImmediately ? new Date() : null;

  return prisma.$transaction(async (tx) => {
    const created = await tx.announcement.create({
      data: {
        title,
        body,
        audience: input.audience,
        classId: input.classId || null,
        authorId: actor.id,
        isPinned: input.isPinned ?? false,
        expiresAt: input.expiresAt || null,
        publishedAt,
      },
      include: {
        author: { select: { id: true, username: true } },
        class: { select: { id: true, name: true } },
      },
    });

    if (publishedAt) {
      await broadcastAnnouncementNotifications(tx, created);
    }

    await logAudit({
      actorId: actor.id,
      action: "ANNOUNCEMENT_CREATED",
      entity: "Announcement",
      entityId: created.id,
      description: `Created announcement "${created.title}" (Audience: ${created.audience}, Published: ${Boolean(publishedAt)})`,
      newValue: {
        title: created.title,
        audience: created.audience,
        isPinned: created.isPinned,
        publishedAt: created.publishedAt,
      },
      tx,
    });

    return created;
  });
}

// ------------------------------------------------------------
// 3. Update Announcement
// ------------------------------------------------------------

export async function updateAnnouncement(
  actor: CurrentUser,
  id: string,
  input: UpdateAnnouncementInput,
) {
  const allowed = await canForUser(actor, "announcements.update");
  if (!allowed) throw new ForbiddenError("announcements.update");

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Announcement", id);

  const isStaffAdmin = isAnnouncementAdministrator(actor);

  if (!isStaffAdmin && existing.authorId !== actor.id) {
    throw new ForbiddenError("announcements.update");
  }
  await assertTeacherClassAudience(
    actor,
    input.audience ?? existing.audience,
    input.classId === undefined ? existing.classId : input.classId,
  );

  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.body !== undefined ? { body: input.body.trim() } : {}),
      ...(input.audience !== undefined ? { audience: input.audience } : {}),
      ...(input.classId !== undefined ? { classId: input.classId || null } : {}),
      ...(input.isPinned !== undefined ? { isPinned: input.isPinned } : {}),
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
    },
    include: {
      author: { select: { id: true, username: true } },
      class: { select: { id: true, name: true } },
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "ANNOUNCEMENT_UPDATED",
    entity: "Announcement",
    entityId: id,
    description: `Updated announcement "${updated.title}"`,
    previousValue: {
      title: existing.title,
      audience: existing.audience,
      isPinned: existing.isPinned,
    },
    newValue: {
      title: updated.title,
      audience: updated.audience,
      isPinned: updated.isPinned,
    },
  });

  return updated;
}

// ------------------------------------------------------------
// 4. Publish Announcement
// ------------------------------------------------------------

export async function publishAnnouncement(
  actor: CurrentUser,
  id: string,
) {
  const allowed = await canForUser(actor, "announcements.publish");
  if (!allowed) throw new ForbiddenError("announcements.publish");

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Announcement", id);

  if (existing.publishedAt) {
    return existing; // already published
  }
  await assertTeacherClassAudience(actor, existing.audience, existing.classId);

  return prisma.$transaction(async (tx) => {
    const published = await tx.announcement.update({
      where: { id },
      data: { publishedAt: new Date() },
      include: {
        author: { select: { id: true, username: true } },
        class: { select: { id: true, name: true } },
      },
    });

    await broadcastAnnouncementNotifications(tx, published);

    await logAudit({
      actorId: actor.id,
      action: "ANNOUNCEMENT_PUBLISHED",
      entity: "Announcement",
      entityId: id,
      description: `Published announcement "${published.title}"`,
      tx,
    });

    return published;
  });
}

// ------------------------------------------------------------
// 5. Delete / Archive Announcement
// ------------------------------------------------------------

export async function deleteAnnouncement(
  actor: CurrentUser,
  id: string,
) {
  const allowed = await canForUser(actor, "announcements.archive");
  if (!allowed) throw new ForbiddenError("announcements.archive");

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Announcement", id);

  const isStaffAdmin = isAnnouncementAdministrator(actor);

  if (!isStaffAdmin && existing.authorId !== actor.id) {
    throw new ForbiddenError("announcements.archive");
  }

  await prisma.announcement.delete({ where: { id } });

  await logAudit({
    actorId: actor.id,
    action: "ANNOUNCEMENT_ARCHIVED",
    entity: "Announcement",
    entityId: id,
    description: `Deleted/Archived announcement "${existing.title}"`,
  });

  return { success: true };
}
