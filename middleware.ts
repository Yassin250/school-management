// ============================================================
// Middleware — Coarse Authentication Routing Only
// ============================================================
// This middleware ONLY checks "is there a session?".
// It does NOT check roles, permissions, or resource scope.
//
// Authorization remains at the server boundary:
//   requireCurrentUser() → requirePermission() → domain service
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fetch the JWT from the session cookie
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = Boolean(token?.id);

  // --------------------------------------------------------
  // Rule 1: unauthenticated users cannot access /dashboard
  // --------------------------------------------------------
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      // Preserve the intended destination so we can redirect back later
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // --------------------------------------------------------
  // Rule 2: authenticated users hitting /login are sent to /dashboard
  // --------------------------------------------------------
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Everything else: continue
  return NextResponse.next();
}

// ============================================================
// Matcher — only run middleware where it matters
// ============================================================

export const config = {
  matcher: [
    /*
     * Match /dashboard/* and /login only.
     * Skip: /api, /_next, static files, favicon.
     */
    "/dashboard/:path*",
    "/login",
  ],
};