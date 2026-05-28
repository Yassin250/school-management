import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Debug log
  console.log("PROXY:", pathname, "Session:", !!session);

  // Allow auth API routes
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // Allow static files
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return NextResponse.next();

  // Public routes
  if (pathname === "/login" || pathname === "/unauthorized") return NextResponse.next();

  // Not logged in → login page
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = session.user?.role as string;

  // Logged in on root or login → dashboard
  if (pathname === "/" || pathname === "/login") {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
  }

  // Role-based dashboard protection
  if (pathname.startsWith("/dashboard/") && !pathname.startsWith(`/dashboard/${role}`)) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};