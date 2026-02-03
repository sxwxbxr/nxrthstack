import { neonAuth } from "@neondatabase/auth/next/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;

  // Get session from Neon Auth
  const { session, user } = await neonAuth();
  const isLoggedIn = !!session && !!user;

  // Protected routes that require authentication
  const isProtectedRoute = nextUrl.pathname.startsWith("/dashboard");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isAuthRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register") ||
    nextUrl.pathname.startsWith("/auth");

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Protect dashboard routes
  if (isProtectedRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }

  // Protect admin routes - just check auth, role check happens at layout level
  if (isAdminRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/auth/:path*",
  ],
};
