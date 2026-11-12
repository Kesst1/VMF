import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminOrApiKey } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const denied = await requireAdminOrApiKey(req); if (denied) return denied;
  try {
    const body = await req.json();
    if (body.confirmation !== "DELETE ALL VMF") {
      return NextResponse.json({ error: "Explicit confirmation is required" }, { status: 400 });
    }

    // Delete dependent match data first, then competition registrations and parent rows.
    const matchEvents = await sql`DELETE FROM match_events RETURNING id`;
    const matchReports = await sql`DELETE FROM match_reports RETURNING id`;
    const fixtures = await sql`DELETE FROM fixtures RETURNING id`;
    await sql`DELETE FROM competition_teams`;
    const competitions = await sql`DELETE FROM competitions RETURNING id`;
    const teams = await sql`DELETE FROM teams RETURNING id`;

    return NextResponse.json({
      deleted: {
        match_events: matchEvents.length,
        match_reports: matchReports.length,
        fixtures: fixtures.length,
        competitions: competitions.length,
        teams: teams.length,
      },
    });
  } catch (error) {
    console.error("Delete all VMF data failed", error);
    return NextResponse.json({ error: "Could not delete all VMF data. Check that match_events and match_reports tables exist." }, { status: 500 });
  }
}
