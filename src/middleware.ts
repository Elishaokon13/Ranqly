import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Security headers for all responses. Session enforcement for HTML routes stays
 * client-side (RequireAuth + ApiSessionGate) because JWT lives in localStorage;
 * APIs enforce auth with requireAuth.
 */
export function middleware(_request: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("X-Content-Type-Options", "nosniff");
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all pathnames except Next internals and static files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
