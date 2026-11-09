import {sql} from "@/lib/db";
import {PageHeading,EmptyState} from "@/components/SiteShell";
export const dynamic="force-dynamic";

type Fixture = { id:string; competition:string|null; home_name:string|null; away_name:string|null; home_score:number|null; away_score:number|null; scheduled_at:string|null; status:string; matchday:number|null; stage:string|null; group_name:string|null; round_name:string|null };
export default async function Fixtures(){
  let rows:Fixture[]=[];
  try{rows=await sql`SELECT f.*,c.name competition,ht.name home_name,at.name away_name FROM fixtures f LEFT JOIN competitions c ON c.id=f.competition_id LEFT JOIN teams ht ON ht.id=f.home_team_id LEFT JOIN teams at ON at.id=f.away_team_id ORDER BY c.name,f.stage,f.group_name,f.matchday NULLS LAST,f.scheduled_at NULLS LAST,f.created_at DESC LIMIT 200` as Fixture[];}catch{}
  const competitions = new Map<string, Map<string, Fixture[]>>();
  for (const fixture of rows) {
    const competition = fixture.competition || "VMF";
    const day = fixture.matchday == null ? (fixture.round_name || "Other fixtures") : `Matchday ${fixture.matchday}`;
    if (!competitions.has(competition)) competitions.set(competition, new Map());
    const days = competitions.get(competition)!;
    if (!days.has(day)) days.set(day, []);
    days.get(day)!.push(fixture);
  }
  return <main className="container"><PageHeading eyebrow="MATCH CENTRE" title="Fixtures & results." description="Every competition, organised into clear matchday sections so you can follow each round without confusion."/><section className="content-section">{rows.length?[...competitions.entries()].map(([competition,days])=><section className="fixture-competition" key={competition}><div className="fixture-competition-heading"><span className="eyebrow">COMPETITION</span><h2>{competition} Fixture</h2><span className="fixture-count">{[...days.values()].reduce((n,items)=>n+items.length,0)} MATCHES</span></div>{[...days.entries()].map(([day,fixtures])=><section className="matchday-block" key={day}><div className="matchday-heading"><span>{day}</span><small>{fixtures.length} {fixtures.length===1?"MATCH":"MATCHES"}</small></div><div className="fixture-list">{fixtures.map(f=><article className="fixture-card" key={f.id}><div className="fixture-meta"><span>{f.stage === "group" && f.group_name ? `GROUP ${f.group_name}` : f.stage || "FIXTURE"}</span><span className="pill">{f.status}</span></div><div className="fixture-teams"><strong>{f.home_name||"TBC"}</strong><b className="fixture-score">{f.home_score??"—"} <i>:</i> {f.away_score??"—"}</b><strong>{f.away_name||"TBC"}</strong></div><div className="fixture-date">{f.scheduled_at?new Date(f.scheduled_at).toLocaleString("en-GB"):"Date to be confirmed"}</div></article>)}</div></section>)}</section>):<EmptyState title="No fixtures available" detail="Fixtures will appear here as soon as a competition schedule is generated."/>}</section></main>
}
