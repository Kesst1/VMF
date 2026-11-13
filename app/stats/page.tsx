import { sql } from "@/lib/db";
import { PageHeading, EmptyState } from "@/components/SiteShell";
export const dynamic = "force-dynamic";
type Row = { competition_id: string | null; competition_name: string; season: string | null; roblox_id: string; player_name: string; goals: number; assists: number };
export default async function Stats() {
  let rows: Row[] = [];
  try {
    rows = await sql`
      SELECT f.competition_id, c.name AS competition_name, c.season,
             me.roblox_id, me.player_name,
             COUNT(*) FILTER (WHERE me.event_type = 'goal')::int AS goals,
             COUNT(*) FILTER (WHERE me.event_type = 'assist')::int AS assists
      FROM match_events me
      JOIN fixtures f ON f.id = me.fixture_id
      JOIN competitions c ON c.id = f.competition_id
      WHERE f.status = 'confirmed'
      GROUP BY f.competition_id, c.name, c.season, me.roblox_id, me.player_name
      ORDER BY c.name, goals DESC, assists DESC, me.player_name
    ` as Row[];
  } catch { rows = []; }
  const global = new Map<string, { roblox_id: string; player_name: string; goals: number; assists: number }>();
  for (const r of rows) {
    const p = global.get(r.roblox_id) || { roblox_id: r.roblox_id, player_name: r.player_name, goals: 0, assists: 0 };
    p.goals += Number(r.goals); p.assists += Number(r.assists); global.set(r.roblox_id, p);
  }
  const competitions = new Map<string, { title: string; rows: Row[] }>();
  for (const r of rows) {
    const item = competitions.get(r.competition_id || "") || { title: `${r.competition_name}${r.season ? ` · ${r.season}` : ""}`, rows: [] };
    item.rows.push(r); competitions.set(r.competition_id || "", item);
  }
  const renderTable = (items: { roblox_id: string; player_name: string; goals: number; assists: number }[]) => <div className="table-wrap"><table className="data-table"><thead><tr><th>#</th><th>Player</th><th>Goals</th><th>Assists</th></tr></thead><tbody>{items.slice().sort((a,b) => b.goals-a.goals || b.assists-a.assists || a.player_name.localeCompare(b.player_name)).slice(0,20).map((p,i)=><tr key={p.roblox_id}><td>{i+1}</td><td><b>{p.player_name || p.roblox_id}</b></td><td>{p.goals}</td><td>{p.assists}</td></tr>)}</tbody></table></div>;
  return <main className="container"><PageHeading eyebrow="NUMBERS BEHIND THE GAME" title="Statistics." description="Goal and assist rankings across VMF and each competition, updated from confirmed matches."/><section className="content-section">
    {rows.length ? <><section className="stats-ranking"><div className="stats-ranking-heading"><p className="eyebrow">ALL COMPETITIONS</p><h2>Global ranking</h2></div>{renderTable([...global.values()])}</section>
      {[...competitions.entries()].map(([id, item]) => <section className="stats-ranking" key={id}><div className="stats-ranking-heading"><p className="eyebrow">COMPETITION RANKING</p><h2>{item.title}</h2></div>{renderTable(item.rows)}</section>)}
      <style>{`.stats-ranking{margin:0 0 42px}.stats-ranking-heading{display:flex;align-items:end;justify-content:space-between;gap:16px;margin:0 0 14px;flex-wrap:wrap}.stats-ranking-heading .eyebrow{margin:0}.stats-ranking-heading h2{font:700 25px 'Space Grotesk';margin:0}`}</style>
    </> : <EmptyState title="Statistics coming soon" detail="The leaderboard will update automatically as confirmed match events are added."/>}
  </section></main>;
}
