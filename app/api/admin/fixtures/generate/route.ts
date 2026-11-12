import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminOrApiKey } from "@/lib/admin-auth";

type Team = { team_id: string; name: string };
type Match = { home: string; away: string };

function roundRobin(teamIds: string[]): Match[][] {
  const rotation = [...teamIds];
  if (rotation.length % 2 !== 0) rotation.push("__BYE__");
  const rounds: Match[][] = [];

  for (let round = 0; round < rotation.length - 1; round++) {
    const matches: Match[] = [];
    for (let i = 0; i < rotation.length / 2; i++) {
      const first = rotation[i];
      const second = rotation[rotation.length - 1 - i];
      if (first !== "__BYE__" && second !== "__BYE__") {
        matches.push(round % 2 === 0
          ? { home: first, away: second }
          : { home: second, away: first });
      }
    }
    rounds.push(matches);
    rotation.splice(1, 0, rotation.pop()!);
  }
  return rounds;
}

export async function POST(req: Request) {
  const denied = await requireAdminOrApiKey(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const competitionId = String(body.competition_id || "").trim();
    if (!competitionId) {
      return NextResponse.json({ error: "competition_id is required" }, { status: 400 });
    }

    const competitions = await sql`
      SELECT id, format FROM competitions WHERE id = ${competitionId} LIMIT 1
    `;
    if (!competitions.length) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    const format = String(competitions[0].format);
    const teams = await sql`
      SELECT ct.team_id, t.name
      FROM competition_teams ct
      JOIN teams t ON t.id = ct.team_id
      WHERE ct.competition_id = ${competitionId}
      ORDER BY t.name ASC, ct.team_id ASC
    ` as Team[];

    if (format === "table_elimination" && ![12, 16].includes(teams.length)) {
      return NextResponse.json({
        error: `Table + Elimination requires exactly 12 or 16 teams. Currently registered: ${teams.length}.`
      }, { status: 400 });
    }
    if (teams.length < 2) {
      return NextResponse.json({ error: "At least two teams are required" }, { status: 400 });
    }
    if (format === "champions" && teams.length !== 16) {
      return NextResponse.json({ error: `UEFA Format requires exactly 16 teams. Currently registered: ${teams.length}.` }, { status: 400 });
    }

    const existing = await sql`
      SELECT COUNT(*)::int AS count FROM fixtures WHERE competition_id = ${competitionId}
    `;
    if (existing[0].count > 0 && !body.replace) {
      return NextResponse.json({ error: "Fixtures already exist. Set replace=true to regenerate them." }, { status: 409 });
    }

    if (body.replace) {
      const started = await sql`
        SELECT COUNT(*)::int AS count FROM fixtures
        WHERE competition_id = ${competitionId}
          AND status IN ('live', 'submitted', 'confirmed')
      `;
      if (started[0].count > 0) {
        return NextResponse.json({ error: "Cannot replace fixtures after matches have started" }, { status: 409 });
      }
      await sql`DELETE FROM fixtures WHERE competition_id = ${competitionId}`;
    }

    let created = 0;
    let matchdays = 0;

    async function insertRounds(rounds: Match[][], stage: string, groupName: string | null) {
      for (let round = 0; round < rounds.length; round++) {
        for (const match of rounds[round]) {
          await sql`
            INSERT INTO fixtures (
              competition_id, home_team_id, away_team_id, matchday,
              round_name, stage, group_name, status, created_at, updated_at
            ) VALUES (
              ${competitionId}, ${match.home}, ${match.away}, ${round + 1},
              ${stage === "knockout" ? `Round ${round + 1}` : null},
              ${stage}, ${groupName}, 'scheduled', NOW(), NOW()
            )
          `;
          created++;
        }
      }
      matchdays = Math.max(matchdays, rounds.length);
    }

    if (format === "table_elimination") {
      // 12 teams: 3 groups of 4. 16 teams: 4 groups of 4.
      const groupNames = teams.length === 12
        ? ["A", "B", "C"]
        : ["A", "B", "C", "D"];
      for (let index = 0; index < teams.length; index++) {
        const groupName = groupNames[Math.floor(index / 4)];
        await sql`
          UPDATE competition_teams
          SET group_name = ${groupName}
          WHERE competition_id = ${competitionId} AND team_id = ${teams[index].team_id}
        `;
      }

      for (const groupName of groupNames) {
        const members = teams.slice(groupNames.indexOf(groupName) * 4, groupNames.indexOf(groupName) * 4 + 4);
        await insertRounds(roundRobin(members.map(team => team.team_id)), "group", groupName);
      }
    } else if (format === "champions") {
      // UEFA Format: 16-team single table, four rounds, four distinct opponents per team.
      await sql`UPDATE competition_teams SET group_name = NULL WHERE competition_id = ${competitionId}`;
      const shuffled = [...teams].sort((a, b) => a.name.localeCompare(b.name));
      // Circle-method schedule: every team meets a different opponent in each of the first four rounds.
      const rounds = roundRobin(shuffled.map(team => team.team_id)).slice(0, 4);
      await insertRounds(rounds, "uefa_league", null);
    } else if (format === "league") {
      // Clear any stale group assignment from an earlier format.
      await sql`UPDATE competition_teams SET group_name = NULL WHERE competition_id = ${competitionId}`;
      await insertRounds(roundRobin(teams.map(team => team.team_id)), "league", null);
    } else if (format === "elimination") {
      await sql`UPDATE competition_teams SET group_name = NULL WHERE competition_id = ${competitionId}`;
      const ids = teams.map(team => team.team_id);
      let bracketSize = 1;
      while (bracketSize < ids.length) bracketSize *= 2;
      const padded = [...ids, ...Array(bracketSize - ids.length).fill("__BYE__")];
      const firstRound: Match[] = [];
      for (let index = 0; index < bracketSize / 2; index++) {
        const home = padded[index];
        const away = padded[bracketSize - 1 - index];
        if (home !== "__BYE__" && away !== "__BYE__") firstRound.push({ home, away });
      }
      await insertRounds([firstRound], "knockout", null);
    } else {
      return NextResponse.json({ error: "Unsupported tournament format" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      competition_id: competitionId,
      format,
      teams: teams.length,
      created,
      matchdays,
      groups: format === "table_elimination"
        ? (teams.length === 12 ? ["A", "B", "C"] : ["A", "B", "C", "D"])
        : undefined,
      qualified_total: format === "table_elimination" ? (teams.length === 12 ? 8 : 12) : undefined,
      uefa_format: format === "champions" ? { league_matches_per_team: 4, direct_qualifiers: 8, repechage_qualifiers: 4, total_knockout_teams: 12 } : undefined,
      qualification_rule: format === "table_elimination"
        ? (teams.length === 12
            ? "Top two in each group plus the two best third-placed teams by goal difference"
            : "Top three in each group")
        : undefined
    });
  } catch (error) {
    console.error("Fixture generation error:", error);
    return NextResponse.json({ error: "Could not generate fixtures" }, { status: 500 });
  }
}
