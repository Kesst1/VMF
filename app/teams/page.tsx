import {sql} from "@/lib/db";
import {PageHeading,EmptyState} from "@/components/SiteShell";
export const dynamic="force-dynamic";
export default async function Teams(){
 let rows:any[]=[];
 try { rows=await sql`SELECT t.id,t.name,t.short_name,t.logo_url,t.country,c.id AS competition_id,c.name AS competition_name FROM teams t LEFT JOIN competition_teams ct ON ct.team_id=t.id LEFT JOIN competitions c ON c.id=ct.competition_id ORDER BY c.name NULLS LAST,t.name`; } catch {}
 const grouped = new Map<string,{name:string,teams:any[]}>();
 for(const team of rows){ const key=team.competition_id?String(team.competition_id):"unassigned"; if(!grouped.has(key))grouped.set(key,{name:team.competition_name||"Unassigned teams",teams:[]}); if(!grouped.get(key)!.teams.some((x:any)=>x.id===team.id))grouped.get(key)!.teams.push(team); }
 return <main className="container"><PageHeading eyebrow="THE VMF COMMUNITY" title="Teams." description="Explore VMF Nations and VMF Clubs, organised by competition."/><section className="content-section">{rows.length?Array.from(grouped.entries()).map(([key,group])=><section className="team-competition" key={key}><div className="section-head"><div><p className="eyebrow">COMPETITION</p><h2>{group.name}</h2></div><span className="muted">{group.teams.length} TEAMS</span></div><div className="card-grid">{group.teams.map((t:any)=>{const nation=!!t.country;return <article className="entity-card" key={t.id}><span className="pill">{nation?"VMF Nation":"VMF Club"}</span><h3 style={{marginTop:16}}>{t.name}</h3><p>{t.short_name|| (nation?t.country:"Official VMF club")}</p></article>})}</div></section>):<EmptyState title="Teams coming soon" detail="Official VMF teams will appear here once registered in a competition."/>}</section></main>
}
