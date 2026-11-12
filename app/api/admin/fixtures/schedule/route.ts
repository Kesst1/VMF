import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminOrApiKey } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const denied = await requireAdminOrApiKey(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const competitionId = String(body.competition_id || "").trim();
    const matchday = Number(body.matchday);
    const scheduledAt = String(body.scheduled_at || "").trim();
    const intervalMinutes = Number(body.interval_minutes ?? 90);

    if (!competitionId || !Number.isInteger(matchday) || matchday < 1 || !scheduledAt ||
        !Number.isInteger(intervalMinutes) || intervalMinutes < 15 || intervalMinutes > 1440) {
      return NextResponse.json({ error: "competition_id, a valid matchday, scheduled_at and interval_minutes (15-1440) are required" }, { status: 400 });
    }
const date = new Date(scheduledAt);

if (
  Number.isNaN(date.getTime()) ||
  !/[+-]\d{2}:\d{2}$/.test(scheduledAt)
) {
  return NextResponse.json(
    { error: "scheduled_at must be an ISO datetime with timezone offset" },
    { status: 400 }
  );
}

    // Assign a different kickoff to each fixture, in a stable order, leaving
    // the configured interval between matches so the referee team can rotate.
    const result = await sql`
      WITH ordered AS (
        SELECT id,
               ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) - 1 AS slot
        FROM fixtures
        WHERE competition_id = ${competitionId} AND matchday = ${matchday}
          AND status NOT IN ('live', 'submitted', 'confirmed')
      )
      UPDATE fixtures AS f
      SET scheduled_at = (${date.toISOString()}::timestamptz + (ordered.slot * ${intervalMinutes}) * INTERVAL '1 minute'),
          updated_at = NOW()
      FROM ordered
      WHERE f.id = ordered.id
      RETURNING f.id, f.scheduled_at
    `;

    if (!result.length) {
      return NextResponse.json({ error: "No editable fixtures found for that matchday. Check the competition name and matchday; completed or started matches are not changed." }, { status: 404 });
    }

    return NextResponse.json({ success: true, competition_id: competitionId, matchday, updated: result.length, first_kickoff: date.toISOString(), interval_minutes: intervalMinutes });
  } catch (error) {
    console.error("Fixture scheduling error:", error);
    return NextResponse.json({ error: "Could not schedule matchday" }, { status: 500 });
  }
}
