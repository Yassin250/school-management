import type { NextConfig } from "next";

/** Lowercase URL segments → folder names under `src/app/dashboard/admin/List/`. */
const ADMIN_LIST_ROUTE_DIRS: Record<string, string> = {
  teachers: "Teachers",
  students: "Students",
  parents: "Parents",
  classes: "Classes",
  subjects: "Subjects",
  exams: "Exams",
  events: "Events",
  announcements: "Announcements",
};

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.65"],
  // App Router URLs match folder casing. Folders are `List/Teachers`, etc., but links use
  // lowercase `/dashboard/admin/list/...`. Rewrites bridge that; when you add a page under
  // `List/<PascalName>/`, add an entry above and restart dev.
  async rewrites() {
    return Object.entries(ADMIN_LIST_ROUTE_DIRS).flatMap(([urlSeg, dirName]) => [
      {
        source: `/dashboard/admin/list/${urlSeg}`,
        destination: `/dashboard/admin/List/${dirName}`,
      },
      {
        source: `/dashboard/admin/list/${urlSeg}/:path*`,
        destination: `/dashboard/admin/List/${dirName}/:path*`,
      },
    ]);
  },
};

export default nextConfig;