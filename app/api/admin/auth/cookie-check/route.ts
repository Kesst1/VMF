
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get("vmf_admin_session");

  return NextResponse.json(
    {
      received: Boolean(cookie?.value),
      host: request.headers.get("host"),
      path: request.nextUrl.pathname,
      secure: request.nextUrl.protocol === "https:",
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
