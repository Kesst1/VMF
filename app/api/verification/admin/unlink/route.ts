
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

export async function POST(request: NextRequest) {
  try {
    if (!authorized(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Compatible with your existing Wispbyte bot
    const discordId =
      request.nextUrl.searchParams.get("discord_id");

    if (!discordId || !/^\d{17,20}$/.test(discordId)) {
      return NextResponse.json(
        { error: "Invalid Discord ID" },
        { status: 400 }
      );
    }

    const deleted = await sql`
      DELETE FROM verified_users
      WHERE discord_id = ${discordId}
      RETURNING discord_id
    `;

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "User not verified" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification unlinked successfully",
      discord_id: discordId,
    });

  } catch (error) {
    console.error("Admin unlink error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
