
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();

    const fixtureId = String(body.fixture_id || "").trim();
    const homeScore = body.home_score;
    const awayScore = body.away_score;

    if (
      !fixtureId ||
      !Number.isInteger(homeScore) ||
      !Number.isInteger(awayScore) ||
      homeScore < 0 ||
      awayScore < 0 ||
      homeScore > 99 ||
      awayScore > 99
    ) {
      return NextResponse.json(
        { error: "Select a fixture and provide valid non-negative scores (0–99)." },
        { status: 400 }
      );
    }

    const rows = await sql`
      UPDATE fixtures
      SET
        home_score = ${homeScore},
        away_score = ${awayScore},
        status = 'confirmed',
        played_at = COALESCE(played_at, NOW()),
        updated_at = NOW()
      WHERE id = ${fixtureId}
        AND status NOT IN ('confirmed', 'cancelled')
      RETURNING *
    `;

    if (!rows.length) {
      return NextResponse.json(
        { error: "Fixture not found or already confirmed." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, fixture: rows[0] });
  } catch (error) {
    console.error("Result submission error:", error);

    return NextResponse.json(
      { error: "Could not save and confirm result." },
      { status: 500 }
    );
  }
}
