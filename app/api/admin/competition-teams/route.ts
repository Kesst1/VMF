import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export async function POST(req: Request) {
 const denied=await requireAdmin(req); if(denied)return denied;
 try {
  const b=await req.json(); const competitionId=String(b.competition_id||"").trim();
  const teamName=String(b.team_name||"").trim(); const groupName=b.group_name ? String(b.group_name).trim().toUpperCase() : null;
  if(!competitionId||!teamName)return NextResponse.json({error:"competition_id and team_name are required"},{status:400});
  const c=await sql`SELECT format FROM competitions WHERE id=${competitionId} LIMIT 1`;
  if(!c.length)return NextResponse.json({error:"Competition not found"},{status:404});
  let found=await sql`SELECT id,name FROM teams WHERE LOWER(name)=LOWER(${teamName}) LIMIT 1`;
  const team=found[0] || (await sql`INSERT INTO teams(name) VALUES(${teamName}) RETURNING id,name`)[0];
  const exists=await sql`SELECT team_id FROM competition_teams WHERE competition_id=${competitionId} AND team_id=${team.id} LIMIT 1`;
  if(exists.length)return NextResponse.json({error:"This team is already registered"},{status:409});
  await sql`INSERT INTO competition_teams(competition_id,team_id,group_name) VALUES(${competitionId},${team.id},${groupName})`;
  return NextResponse.json({team,group_name:groupName},{status:201});
 } catch(e) { console.error(e); return NextResponse.json({error:"Could not add team"},{status:500}); }
}
export async function DELETE(req: Request) {
 const denied=await requireAdmin(req); if(denied)return denied;
 try {
  const {searchParams}=new URL(req.url); const competition_id=searchParams.get("competition_id"); const team_name=searchParams.get("team_name");
  if(!competition_id||!team_name)return NextResponse.json({error:"competition_id and team_name are required"},{status:400});
  const started=await sql`SELECT COUNT(*)::int count FROM fixtures WHERE competition_id=${competition_id} AND status IN ('live','submitted','confirmed')`;
  if(started[0].count)return NextResponse.json({error:"Cannot remove teams after matches have started"},{status:409});
  const rows=await sql`DELETE FROM competition_teams ct USING teams t WHERE ct.team_id=t.id AND ct.competition_id=${competition_id} AND LOWER(t.name)=LOWER(${team_name}) RETURNING t.name`;
  if(!rows.length)return NextResponse.json({error:"Team not registered in this competition"},{status:404});
  return NextResponse.json({removed:rows[0].name});
 } catch { return NextResponse.json({error:"Could not remove team"},{status:500}); }
}
