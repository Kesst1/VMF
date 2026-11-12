import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin?auth=logged_out", request.url), 303);

  // Clear the session cookie using the same path and security attributes
  // used when the Discord OAuth callback creates it.
  response.cookies.set("vmf_admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  // Also clear any stale OAuth state cookie.
  response.cookies.set("vmf_admin_oauth_state", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin/auth/callback",
    expires: new Date(0),
    maxAge: 0,
  });

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}
