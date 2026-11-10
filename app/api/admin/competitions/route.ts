import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const FORMATS = ["league", "table_elimination", "elimination", "champions"] as const;

export async function POST(req: Request) {
  const denied = await requireAdmin(req); if (denied) return denied;
  try {
    const b = await req.json();
    if (typeof b.name !== "string" || !b.name.trim()) return NextResponse.json({error:"name is required"},{status:400});
    if (!FORMATS.includes(b.format)) return NextResponse.json({error:"Invalid tournament type"},{status:400});
    const rows = await sql`INSERT INTO competitions(name,description,format,status,season,created_at,updated_at)
      VALUES(${b.name.trim()},${b.description || null},${b.format},${b.status || "draft"},${b.season || null},NOW(),NOW()) RETURNING *`;
    return NextResponse.json({competition:rows[0]},{status:201});
  } catch { return NextResponse.json({error:"Could not create competition"},{status:500}); }
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin(req); if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url); const id = searchParams.get("id");
    if (!id) return NextResponse.json({error:"id is required"},{status:400});
    const fixtureIds = await sql`SELECT id FROM fixtures WHERE competition_id=${id}`;
    for (const fixture of fixtureIds) {
      await sql`DELETE FROM match_events WHERE fixture_id=${fixture.id}`;
      await sql`DELETE FROM match_reports WHERE fixture_id=${fixture.id}`;
    }
    await sql`DELETE FROM fixtures WHERE competition_id=${id}`;
    await sql`DELETE FROM competition_teams WHERE competition_id=${id}`;
    const rows = await sql`DELETE FROM competitions WHERE id=${id} RETURNING id`;
    if (!rows.length) return NextResponse.json({error:"Competition not found"},{status:404});
    return NextResponse.json({deleted:true,id});
  } catch { return NextResponse.json({error:"Could not delete competition"},{status:500}); }
}
