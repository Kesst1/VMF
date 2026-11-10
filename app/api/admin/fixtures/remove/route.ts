import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function DELETE(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    const fixtureId = searchParams.get("id");
    if (!fixtureId) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const exists = await sql`SELECT id FROM fixtures WHERE id = ${fixtureId} LIMIT 1`;
    if (!exists.length) return NextResponse.json({ error: "Fixture not found" }, { status: 404 });
    await sql`DELETE FROM match_events WHERE fixture_id = ${fixtureId}`;
    await sql`DELETE FROM match_reports WHERE fixture_id = ${fixtureId}`;
    const deleted = await sql`DELETE FROM fixtures WHERE id = ${fixtureId} RETURNING id`;
    return NextResponse.json({ deleted: true, id: deleted[0].id });
  } catch (error) {
    console.error("Fixture removal failed", error);
    return NextResponse.json({ error: "Could not remove fixture" }, { status: 500 });
  }
}
