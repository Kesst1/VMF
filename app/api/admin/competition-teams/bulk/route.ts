import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const denied = requireAdmin(req); if (denied) return denied;
  try {
    const body = await req.json();
    const competitionId = String(body.competition_id || "").trim();
    const names = Array.isArray(body.team_names)
      ? [...new Set(body.team_names.map((v: unknown) => String(v).trim()).filter(Boolean))]
      : [];
    const groupName = body.group_name ? String(body.group_name).trim().toUpperCase() : null;
    if (!competitionId || !names.length) return NextResponse.json({ error: "competition_id and team_names are required" }, { status: 400 });
    if (names.length > 64) return NextResponse.json({ error: "A maximum of 64 teams can be added at once" }, { status: 400 });
    const competition = await sql`SELECT id FROM competitions WHERE id=${competitionId} LIMIT 1`;
    if (!competition.length) return NextResponse.json({ error: "Competition not found" }, { status: 404 });

    let added = 0;
    let skipped = 0;
    const addedNames: string[] = [];
    for (const name of names) {
      const found = await sql`SELECT id,name FROM teams WHERE LOWER(name)=LOWER(${name}) LIMIT 1`;
      const team = found[0] || (await sql`INSERT INTO teams(name) VALUES(${name}) RETURNING id,name`)[0];
      const exists = await sql`SELECT 1 FROM competition_teams WHERE competition_id=${competitionId} AND team_id=${team.id} LIMIT 1`;
      if (exists.length) { skipped++; continue; }
      await sql`INSERT INTO competition_teams(competition_id,team_id,group_name) VALUES(${competitionId},${team.id},${groupName})`;
      added++; addedNames.push(team.name);
    }
    return NextResponse.json({ added, skipped, teams: addedNames }, { status: 200 });
  } catch (error) {
    console.error("Bulk team add failed", error);
    return NextResponse.json({ error: "Could not bulk add teams" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = requireAdmin(req); if (denied) return denied;
  try {
    const body = await req.json();
    const competitionId = String(body.competition_id || "").trim();
    const names = Array.isArray(body.team_names)
      ? [...new Set(body.team_names.map((v: unknown) => String(v).trim()).filter(Boolean))]
      : [];
    if (!competitionId || !names.length) return NextResponse.json({ error: "competition_id and team_names are required" }, { status: 400 });
    if (names.length > 64) return NextResponse.json({ error: "A maximum of 64 teams can be removed at once" }, { status: 400 });
    const started = await sql`SELECT COUNT(*)::int AS count FROM fixtures WHERE competition_id=${competitionId} AND status IN ('live','submitted','confirmed')`;
    if (started[0].count) return NextResponse.json({ error: "Cannot remove teams after matches have started" }, { status: 409 });

    let removed = 0;
    let notFound = 0;
    for (const name of names) {
      const matches = await sql`SELECT t.id,t.name FROM teams t JOIN competition_teams ct ON ct.team_id=t.id WHERE ct.competition_id=${competitionId} AND LOWER(t.name)=LOWER(${name}) LIMIT 1`;
      if (!matches.length) { notFound++; continue; }
      const teamId = matches[0].id;
      const fixtureRows = await sql`SELECT id FROM fixtures WHERE competition_id=${competitionId} AND (home_team_id=${teamId} OR away_team_id=${teamId})`;
      for (const fixture of fixtureRows) {
        await sql`DELETE FROM match_events WHERE fixture_id=${fixture.id}`;
        await sql`DELETE FROM match_reports WHERE fixture_id=${fixture.id}`;
      }
      await sql`DELETE FROM fixtures WHERE competition_id=${competitionId} AND (home_team_id=${teamId} OR away_team_id=${teamId})`;
      await sql`DELETE FROM competition_teams WHERE competition_id=${competitionId} AND team_id=${teamId}`;
      removed++;
    }
    return NextResponse.json({ removed, not_found: notFound });
  } catch (error) {
    console.error("Bulk team removal failed", error);
    return NextResponse.json({ error: "Could not bulk remove teams" }, { status: 500 });
  }
}
