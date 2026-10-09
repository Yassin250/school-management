import { Suspense } from "react";
import { requireCurrentUser } from "@/lib/auth/session";
import { canForUser } from "@/lib/permissions/can";
import { listAnnouncements } from "@/lib/services/announcements/announcements";
import { AnnouncementsClient } from "./announcements-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Announcements | Rwanda School Management",
  description:
    "School-wide announcements and communications for students, parents, teachers, and staff.",
};

export default async function AnnouncementsPage() {
  const actor = await requireCurrentUser();

  const [announcements, canCreate] = await Promise.all([
    listAnnouncements(actor, { includeDrafts: true }),
    canForUser(actor, "announcements.create"),
  ]);

  const isStaffAdmin =
    actor.roles.includes("SYSTEM_ADMIN") ||
    actor.roles.includes("SCHOOL_ADMIN") ||
    actor.roles.includes("PRINCIPAL");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Announcements
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {canCreate
              ? "Create, manage, and publish school-wide communications."
              : "Stay up to date with school news and announcements."}
          </p>
        </div>
      </div>

      <Suspense fallback={<AnnouncementsSkeleton />}>
        <AnnouncementsClient
          initialAnnouncements={announcements}
          canCreate={canCreate}
          isStaffAdmin={isStaffAdmin}
          actorId={actor.id}
        />
      </Suspense>
    </div>
  );
}

function AnnouncementsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-24 rounded-xl bg-muted/50 border border-border"
        />
      ))}
    </div>
  );
}
