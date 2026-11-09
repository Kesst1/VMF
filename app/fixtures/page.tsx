import {sql} from "@/lib/db";
import {PageHeading} from "@/components/SiteShell";
import FixtureBrowser from "./FixtureBrowser";
export const dynamic="force-dynamic";
type Fixture={id:string;competition:string|null;home_name:string|null;away_name:string|null;home_score:number|null;away_score:number|null;scheduled_at:string|null;status:string;matchday:number|null;stage:string|null;group_name:string|null;round_name:string|null};
export default async function Fixtures(){let rows:Fixture[]=[];try{rows=await sql`SELECT f.*,c.name competition,ht.name home_name,at.name away_name FROM fixtures f LEFT JOIN competitions c ON c.id=f.competition_id LEFT JOIN teams ht ON ht.id=f.home_team_id LEFT JOIN teams at ON at.id=f.away_team_id ORDER BY c.name,f.stage,f.group_name,f.matchday NULLS LAST,f.scheduled_at NULLS LAST,f.created_at DESC LIMIT 300` as Fixture[];}catch{}return <main className="container"><PageHeading eyebrow="MATCH CENTRE" title="Football Fixtures" description="Upcoming matches from VMF competitions."/><FixtureBrowser rows={rows}/></main>}
