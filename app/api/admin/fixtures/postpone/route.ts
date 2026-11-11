import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const fixtureId = String(body.fixture_id || "").trim();
    const scheduledAt = body.scheduled_at ? String(body.scheduled_at).trim() : null;
    const reason = body.reason ? String(body.reason).trim().slice(0, 500) : null;

    if (!fixtureId) {
      return NextResponse.json({ error: "fixture_id is required" }, { status: 400 });
    }

    if (scheduledAt) {
      const date = new Date(scheduledAt);
      if (Number.isNaN(date.getTime()) || !/[+-]\\d{2}:\\d{2}$/.test(scheduledAt)) {
        return NextResponse.json({ error: "scheduled_at must be an ISO datetime with timezone offset" }, { status: 400 });
      }
      const rows = await sql`
        UPDATE fixtures
        SET scheduled_at = ${date.toISOString()}::timestamptz,
            status = 'scheduled',
            updated_at = NOW()
        WHERE id = ${fixtureId} AND status NOT IN ('live', 'submitted', 'confirmed')
        RETURNING id, status, scheduled_at
      `;
      if (!rows.length) {
        return NextResponse.json({ error: "Fixture not found or it has already started / been confirmed" }, { status: 404 });
      }
      return NextResponse.json({ success: true, action: "rescheduled", fixture: rows[0], reason });
    }

    const rows = await sql`
      UPDATE fixtures
      SET status = 'postponed', updated_at = NOW()
      WHERE id = ${fixtureId} AND status NOT IN ('live', 'submitted', 'confirmed')
      RETURNING id, status, scheduled_at
    `;
    if (!rows.length) {
      return NextResponse.json({ error: "Fixture not found or it has already started / been confirmed" }, { status: 404 });
    }
    return NextResponse.json({ success: true, action: "postponed", fixture: rows[0], reason });
  } catch (error) {
    console.error("Fixture postpone error:", error);
    return NextResponse.json({ error: "Could not postpone fixture" }, { status: 500 });
  }
}
