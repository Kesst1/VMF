import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminOrApiKey } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const denied = await requireAdminOrApiKey(req); if (denied) return denied;
  try {
    const body = await req.json();
    const competitionId = String(body.competition_id || "").trim();
    const homeTeamId = String(body.home_team_id || "").trim();
    const awayTeamId = String(body.away_team_id || "").trim();
    const stage = String(body.stage || "group").trim();
    const matchday = body.matchday == null || body.matchday === "" ? null : Number(body.matchday);
    const groupName = body.group_name ? String(body.group_name).trim().toUpperCase() : null;
    if (!competitionId || !homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
      return NextResponse.json({ error: "Choose a competition and two different teams" }, { status: 400 });
    }
    if (!["group", "league", "knockout"].includes(stage)) return NextResponse.json({ error: "Invalid fixture stage" }, { status: 400 });
    if (matchday !== null && (!Number.isInteger(matchday) || matchday < 1)) return NextResponse.json({ error: "Matchday must be a positive integer" }, { status: 400 });
    const membership = await sql`
      SELECT team_id FROM competition_teams
      WHERE competition_id = ${competitionId} AND team_id IN (${homeTeamId}, ${awayTeamId})
    `;
    if (membership.length !== 2) return NextResponse.json({ error: "Both teams must belong to this competition" }, { status: 400 });
    const rows = await sql`
      INSERT INTO fixtures (competition_id, home_team_id, away_team_id, matchday, round_name, stage, group_name, status, created_at, updated_at)
      VALUES (${competitionId}, ${homeTeamId}, ${awayTeamId}, ${matchday}, ${stage === "knockout" ? String(body.round_name || "Knockout") : null}, ${stage}, ${stage === "group" ? groupName : null}, 'scheduled', NOW(), NOW())
      RETURNING id
    `;
    return NextResponse.json({ success: true, fixture_id: rows[0].id }, { status: 201 });
  } catch (error) {
    console.error("Manual fixture creation failed", error);
    return NextResponse.json({ error: "Could not create fixture" }, { status: 500 });
  }
}
