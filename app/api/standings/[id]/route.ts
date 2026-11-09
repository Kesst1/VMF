import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const competitions = await sql`
      SELECT id, format FROM competitions WHERE id = ${id} LIMIT 1
    `;
    if (!competitions.length) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }
    const format = String(competitions[0].format);
    const groupedFormat = format === "table_elimination" || format === "champions";

    // Repair older Table + Elimination competitions created before group
    // assignments were persisted. Keep existing A-D assignments unchanged.
    if (format === "table_elimination") {
      await sql`
        WITH unassigned AS (
          SELECT ct.team_id,
                 ROW_NUMBER() OVER (ORDER BY t.name ASC, ct.team_id ASC) AS rn
          FROM competition_teams ct
          JOIN teams t ON t.id = ct.team_id
          WHERE ct.competition_id = ${id}
            AND ct.group_name IS NULL
        )
        UPDATE competition_teams ct
        SET group_name = CASE
          WHEN unassigned.rn <= 4 THEN 'A'
          WHEN unassigned.rn <= 8 THEN 'B'
          WHEN unassigned.rn <= 12 THEN 'C'
          ELSE 'D'
        END
        FROM unassigned
        WHERE ct.competition_id = ${id}
          AND ct.team_id = unassigned.team_id
      `;
    }

    const rows = await sql`
      SELECT
        ct.group_name,
        t.id,
        t.name,
        COUNT(f.id)::int AS played,
        COUNT(f.id) FILTER (
          WHERE (f.home_team_id = t.id AND f.home_score > f.away_score)
             OR (f.away_team_id = t.id AND f.away_score > f.home_score)
        )::int AS won,
        COUNT(f.id) FILTER (WHERE f.home_score = f.away_score)::int AS drawn,
        COUNT(f.id) FILTER (
          WHERE (f.home_team_id = t.id AND f.home_score < f.away_score)
             OR (f.away_team_id = t.id AND f.away_score < f.home_score)
        )::int AS lost,
        COALESCE(SUM(CASE WHEN f.home_team_id = t.id THEN f.home_score ELSE f.away_score END), 0)::int AS gf,
        COALESCE(SUM(CASE WHEN f.home_team_id = t.id THEN f.away_score ELSE f.home_score END), 0)::int AS ga
      FROM competition_teams ct
      JOIN teams t ON t.id = ct.team_id
      LEFT JOIN fixtures f
        ON f.competition_id = ct.competition_id
       AND f.status = 'confirmed'
       AND (f.home_team_id = t.id OR f.away_team_id = t.id)
       AND (${groupedFormat} = FALSE OR f.stage = 'group')
      WHERE ct.competition_id = ${id}
      GROUP BY ct.group_name, t.id, t.name
    `;

    const standings = rows.map((row: any) => ({
      ...row,
      played: Number(row.played || 0),
      won: Number(row.won || 0),
      drawn: Number(row.drawn || 0),
      lost: Number(row.lost || 0),
      gf: Number(row.gf || 0),
      ga: Number(row.ga || 0),
      points: Number(row.won || 0) * 3 + Number(row.drawn || 0),
      goal_difference: Number(row.gf || 0) - Number(row.ga || 0)
    }));

    const compare = (a: any, b: any) =>
      b.points - a.points ||
      b.goal_difference - a.goal_difference ||
      b.gf - a.gf ||
      String(a.name).localeCompare(String(b.name));

    const groups: Record<string, any[]> = {};
    for (const team of standings) {
      const groupName = team.group_name || "League";
      (groups[groupName] ||= []).push(team);
    }

    for (const [groupName, groupTeams] of Object.entries(groups)) {
      groupTeams.sort(compare);
      groups[groupName] = groupTeams.map((team, index) => ({
        ...team,
        position: index + 1,
        qualified: format === "table_elimination"
          ? index < 3
          : format === "champions"
            ? index < groupTeams.length - 1
            : false
      }));
    }

    const allTeams = Object.values(groups).flat();
    const overall = [...allTeams].sort(compare).map((team, index) => ({
      ...team,
      overall_position: index + 1
    }));

    // Champions format: the top eight qualify directly; remaining teams are
    // shown in the GD/points-based repechage ranking, as defined for VMF.
    const direct = format === "champions" ? overall.slice(0, 8) : [];
    const repechage = format === "champions" ? overall.slice(8) : [];
    const qualified = format === "table_elimination"
      ? Object.keys(groups).sort().flatMap(group => groups[group].filter(team => team.qualified))
      : [];

    return NextResponse.json({ format, standings: overall, groups, qualified, direct, repechage });
  } catch (error) {
    console.error("Standings API error:", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
