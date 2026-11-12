import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Safe diagnostic endpoint. It reports only whether the session cookie is
 * visible through each Next.js request API; it never returns the cookie value.
 * Remove this endpoint after the authentication issue is resolved.
 */
export async function GET(request: NextRequest) {
  const requestCookie = request.cookies.get("vmf_admin_session")?.value;
  const rawCookieHeader = request.headers.get("cookie") || "";
  const headerHasSession = rawCookieHeader
    .split(";")
    .some((part) => part.trim().startsWith("vmf_admin_session="));

  let nextCookieStoreHasSession = false;
  try {
    const cookieStore = await cookies();
    nextCookieStoreHasSession = Boolean(
      cookieStore.get("vmf_admin_session")?.value
    );
  } catch {
    // Diagnostic only: report false if the request cookie store is unavailable.
  }

  return NextResponse.json(
    {
      requestCookiesHasSession: Boolean(requestCookie),
      rawHeaderHasSession: headerHasSession,
      nextCookieStoreHasSession,
      host: request.headers.get("host"),
      path: request.nextUrl.pathname,
      secure: request.nextUrl.protocol === "https:",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
