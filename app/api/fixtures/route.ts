import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const competition = searchParams.get("competition");

  try {
    const fixtures = competition
      ? await sql`
          SELECT f.*, c.name AS competition, c.format AS competition_format,
                 h.name AS home_name, a.name AS away_name
          FROM fixtures f
          LEFT JOIN competitions c ON c.id = f.competition_id
          LEFT JOIN teams h ON h.id = f.home_team_id
          LEFT JOIN teams a ON a.id = f.away_team_id
          WHERE f.competition_id = ${competition}
          ORDER BY f.stage, f.group_name NULLS LAST, f.matchday NULLS LAST,
                   f.scheduled_at NULLS LAST, f.created_at
        `
      : await sql`
          SELECT f.*, c.name AS competition, c.format AS competition_format,
                 h.name AS home_name, a.name AS away_name
          FROM fixtures f
          LEFT JOIN competitions c ON c.id = f.competition_id
          LEFT JOIN teams h ON h.id = f.home_team_id
          LEFT JOIN teams a ON a.id = f.away_team_id
          ORDER BY f.scheduled_at NULLS LAST, f.created_at DESC
          LIMIT 100
        `;

    return NextResponse.json({ fixtures });
  } catch (error) {
    console.error("Fixtures API error:", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
