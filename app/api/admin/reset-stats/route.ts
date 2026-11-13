import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminOrApiKey } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const denied = await requireAdminOrApiKey(req);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => ({}));
    if (body.confirmation !== "RESET VMF PLAYER STATS") {
      return NextResponse.json({ error: "Explicit confirmation is required." }, { status: 400 });
    }
    const deleted = await sql`DELETE FROM match_events RETURNING id`;
    return NextResponse.json({ reset: deleted.length });
  } catch (error) {
    console.error("Reset VMF player stats failed", error);
    return NextResponse.json({ error: "Could not reset player statistics." }, { status: 500 });
  }
}
