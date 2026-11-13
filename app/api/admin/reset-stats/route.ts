import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminOrApiKey } from "@/lib/admin-auth";

export async function GET(req: Request) {
  const denied = await requireAdminOrApiKey(req);
  if (denied) return denied;
  try {
    const competitions = await sql`SELECT id, name, season FROM competitions ORDER BY created_at DESC`;
    const players = await sql`
      SELECT DISTINCT me.roblox_id, me.player_name, f.competition_id
      FROM match_events me
      JOIN fixtures f ON f.id = me.fixture_id
      WHERE f.status = 'confirmed'
      ORDER BY me.player_name
    `;
    return NextResponse.json({ competitions, players });
  } catch (error) {
    console.error("Load reset-stat options failed", error);
    return NextResponse.json({ error: "Could not load player statistics." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = await requireAdminOrApiKey(req);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => ({}));
    const competitionId = body.competition_id ? String(body.competition_id) : null;
    const robloxId = body.roblox_id ? String(body.roblox_id) : null;
    const eventType = String(body.event_type || "both");
    if (!competitionId || !robloxId || !["goal", "assist", "both"].includes(eventType)) {
      return NextResponse.json({ error: "Choose a competition, player and valid statistic type." }, { status: 400 });
    }
    if (body.confirmation !== "RESET SELECTED STATS") {
      return NextResponse.json({ error: "Explicit confirmation is required." }, { status: 400 });
    }
    const deleted = eventType === "both"
      ? await sql`DELETE FROM match_events me USING fixtures f WHERE me.fixture_id = f.id AND f.competition_id = ${competitionId} AND me.roblox_id = ${robloxId} RETURNING me.id`
      : await sql`DELETE FROM match_events me USING fixtures f WHERE me.fixture_id = f.id AND f.competition_id = ${competitionId} AND me.roblox_id = ${robloxId} AND me.event_type = ${eventType} RETURNING me.id`;
    return NextResponse.json({ reset: deleted.length });
  } catch (error) {
    console.error("Reset selected player stats failed", error);
    return NextResponse.json({ error: "Could not reset selected player statistics." }, { status: 500 });
  }
}
