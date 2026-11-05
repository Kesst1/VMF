
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { sql } from "../../../../../lib/db";

export const runtime = "nodejs";

function authorized(request: NextRequest): boolean {
  const expectedKey = process.env.ADMIN_API_KEY;
  const suppliedKey = request.headers.get("x-admin-key") || "";

  if (!expectedKey || !suppliedKey) return false;

  const expected = Buffer.from(expectedKey);
  const supplied = Buffer.from(suppliedKey);

  return (
    expected.length === supplied.length &&
    timingSafeEqual(expected, supplied)
  );
}

export async function GET(request: NextRequest) {
  try {
    if (!authorized(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const discordId =
      request.nextUrl.searchParams.get("discord_id");

    if (!discordId || !/^\d{17,20}$/.test(discordId)) {
      return NextResponse.json(
        { error: "Invalid Discord ID" },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT discord_id, roblox_id, roblox_username, created_at
      FROM verified_users
      WHERE discord_id = ${discordId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "User not verified" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      discord_id: String(rows[0].discord_id),
      roblox_id: String(rows[0].roblox_id),
      roblox_username: rows[0].roblox_username,
      created_at: rows[0].created_at,
    });

  } catch (error) {
    console.error("Admin check error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
