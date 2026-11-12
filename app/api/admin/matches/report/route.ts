
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminOrApiKey } from "@/lib/admin-auth";


async function generateNextKnockoutRound(competitionId: string) {
  const compRows = await sql`SELECT format FROM competitions WHERE id=${competitionId} LIMIT 1`;
  if (!compRows.length || String(compRows[0].format) !== "table_elimination") return null;
  const existing = await sql`SELECT id, round_name, status, home_team_id, away_team_id, home_score, away_score FROM fixtures WHERE competition_id=${competitionId} AND stage='knockout' ORDER BY created_at, id`;
  if (!existing.length) {
    const counts = await sql`SELECT COUNT(*)::int total, COUNT(*) FILTER (WHERE status='confirmed')::int confirmed FROM fixtures WHERE competition_id=${competitionId} AND stage='group'`;
    if (!counts[0] || counts[0].total === 0 || counts[0].total !== counts[0].confirmed) return null;
    const teams = await sql`SELECT ct.team_id, ct.group_name, t.name,
      COALESCE(SUM(CASE WHEN f.home_team_id=ct.team_id THEN f.home_score WHEN f.away_team_id=ct.team_id THEN f.away_score ELSE 0 END),0)::int gf,
      COALESCE(SUM(CASE WHEN f.home_team_id=ct.team_id THEN f.away_score WHEN f.away_team_id=ct.team_id THEN f.home_score ELSE 0 END),0)::int ga,
      COUNT(f.id) FILTER(WHERE (f.home_team_id=ct.team_id AND f.home_score>f.away_score) OR (f.away_team_id=ct.team_id AND f.away_score>f.home_score))::int won,
      COUNT(f.id) FILTER(WHERE f.home_score=f.away_score)::int drawn
      FROM competition_teams ct JOIN teams t ON t.id=ct.team_id
      LEFT JOIN fixtures f ON f.competition_id=ct.competition_id AND f.stage='group' AND f.status='confirmed' AND (f.home_team_id=ct.team_id OR f.away_team_id=ct.team_id)
      WHERE ct.competition_id=${competitionId} GROUP BY ct.team_id,ct.group_name,t.name ORDER BY ct.group_name,t.name`;
    const groups = new Map<string, any[]>();
    for (const team of teams as any[]) { const key=String(team.group_name||'A'); if(!groups.has(key)) groups.set(key,[]); const list=groups.get(key)!; list.push({...team,gd:team.gf-team.ga,points:team.won*3+team.drawn}); }
    for (const list of groups.values()) list.sort((a,b)=>b.points-a.points||b.gd-a.gd||b.gf-a.gf||String(a.name).localeCompare(String(b.name)));
    const ranked=[...groups.entries()].sort(([a],[b])=>a.localeCompare(b));
    let matches:{home:string;away:string}[]=[]; let round='Quarter-finals';
    if(ranked.length===3){
      const thirds=ranked.map(([,g])=>g[2]).filter(Boolean).sort((a,b)=>b.points-a.points||b.gd-a.gd||b.gf-a.gf||String(a.name).localeCompare(String(b.name)));
      const qualified=[...ranked.flatMap(([,g])=>g.slice(0,2)),...thirds.slice(0,2)];
      for(let i=0;i<4;i++) matches.push({home:qualified[i].team_id,away:qualified[qualified.length-1-i].team_id});
    } else if(ranked.length===4 && ranked.every(([,g])=>g.length===3)){
      // 12 teams in four groups of three: top two from every group qualify (8 total).
      const qualified=ranked.flatMap(([,g])=>g.slice(0,2));
      for(let i=0;i<4;i++) matches.push({home:qualified[i].team_id,away:qualified[qualified.length-1-i].team_id});
      round='Quarter-finals';
    } else if(ranked.length===4 && ranked.every(([,g])=>g.length===4)){
      const winners=ranked.map(([,g])=>g[0]);
      for(const winner of winners) await sql`INSERT INTO competition_bracket_byes (competition_id,team_id,enters_round) VALUES (${competitionId},${winner.team_id},'Quarter-finals') ON CONFLICT DO NOTHING`;
      for(let i=0;i<4;i++){ const runner=ranked[i][1][1], third=ranked[(i+1)%4][1][2]; matches.push({home:runner.team_id,away:third.team_id}); }
      round='Round of 12';
    } else return null;
    for(const m of matches) await sql`INSERT INTO fixtures (competition_id,home_team_id,away_team_id,round_name,stage,group_name,status,created_at,updated_at) VALUES (${competitionId},${m.home},${m.away},${round},'knockout',NULL,'scheduled',NOW(),NOW())`;
    return round;
  }
  const order=['Round of 12','Quarter-finals','Semi-finals','Final'];
  const completedRounds=order.filter(r=>existing.some((f:any)=>f.round_name===r));
  const latest=completedRounds[completedRounds.length-1];
  if(!latest) return null;
  const current=existing.filter((f:any)=>f.round_name===latest);
  if(!current.length||current.some((f:any)=>f.status!=='confirmed')) return null;
  if(latest==='Final') return null;
  let advancing=current.map((f:any)=>String(Number(f.home_score)>Number(f.away_score)?f.home_team_id:f.away_team_id));
  const next=order[order.indexOf(latest)+1];
  if(latest==='Round of 12'){
    const byes=await sql`SELECT team_id FROM competition_bracket_byes WHERE competition_id=${competitionId} AND enters_round='Quarter-finals' ORDER BY team_id`;
    advancing=[...byes.map((b:any)=>String(b.team_id)),...advancing];
  }
  const already=await sql`SELECT COUNT(*)::int count FROM fixtures WHERE competition_id=${competitionId} AND stage='knockout' AND round_name=${next}`;
  if(already[0]?.count>0) return null;
  if(advancing.length%2!==0) return null;
  for(let i=0;i<advancing.length;i+=2) await sql`INSERT INTO fixtures (competition_id,home_team_id,away_team_id,round_name,stage,group_name,status,created_at,updated_at) VALUES (${competitionId},${advancing[i]},${advancing[i+1]},${next},'knockout',NULL,'scheduled',NOW(),NOW())`;
  return next;
}

export async function POST(req: Request) {
  const denied = await requireAdminOrApiKey(req);
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

    const goalScorers = Array.isArray(body.goal_scorers) ? body.goal_scorers.map((v: unknown) => String(v).trim()).filter(Boolean) : [];
    const assists = Array.isArray(body.assists) ? body.assists.map((v: unknown) => String(v).trim()).filter(Boolean) : [];
    if (goalScorers.length && goalScorers.length !== homeScore + awayScore) {
      return NextResponse.json({ error: `Enter one goal scorer for each goal (${homeScore + awayScore} names expected), or leave the scorer field empty.` }, { status: 400 });
    }
    if (assists.length > goalScorers.length) {
      return NextResponse.json({ error: "There cannot be more assists than recorded goals." }, { status: 400 });
    }

    const target = await sql`SELECT competition_id, stage FROM fixtures WHERE id=${fixtureId} LIMIT 1`;
    if (!target.length) return NextResponse.json({ error: "Fixture not found." }, { status: 404 });
    if (target[0].stage === "knockout" && homeScore === awayScore) return NextResponse.json({ error: "Knockout matches cannot finish level. Enter a decisive score after extra time / penalties." }, { status: 400 });

    // Resolve every entered name before confirming the fixture, so a typo cannot leave a confirmed result without its events.
    const allNames = [...new Set([...goalScorers, ...assists])];
    const verified = allNames.length ? await sql`SELECT roblox_id, roblox_username FROM verified_users WHERE LOWER(roblox_username)=ANY(${allNames.map((n: string) => n.toLowerCase())})` : [];
    const byName = new Map((verified as any[]).map(p => [String(p.roblox_username).toLowerCase(), p]));
    const missing = allNames.filter((name: string) => !byName.has(name.toLowerCase()));
    if (missing.length) return NextResponse.json({ error: `These players are not verified or their Roblox usernames do not match: ${missing.join(", ")}.` }, { status: 400 });

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

    // Store goals and assists using verified Roblox IDs. No minute field is required.
    for (const name of goalScorers) {
      const player = byName.get(name.toLowerCase());
      await sql`INSERT INTO match_events (fixture_id, roblox_id, player_name, event_type) VALUES (${fixtureId}, ${String(player.roblox_id)}, ${String(player.roblox_username)}, 'goal')`;
    }
    for (const name of assists) {
      const player = byName.get(name.toLowerCase());
      await sql`INSERT INTO match_events (fixture_id, roblox_id, player_name, event_type) VALUES (${fixtureId}, ${String(player.roblox_id)}, ${String(player.roblox_username)}, 'assist')`;
    }

    let nextRound = null;
    let bracketWarning = null;
    if (target[0].competition_id) {
      try { nextRound = await generateNextKnockoutRound(String(target[0].competition_id)); }
      catch (bracketError) { console.error("Bracket progression error:", bracketError); bracketWarning = "Result confirmed, but bracket progression needs the latest database migration."; }
    }
    return NextResponse.json({ success: true, fixture: rows[0], next_round: nextRound, bracket_warning: bracketWarning });
  } catch (error) {
    console.error("Result submission error:", error);

    return NextResponse.json(
      { error: "Could not save and confirm result." },
      { status: 500 }
    );
  }
}
