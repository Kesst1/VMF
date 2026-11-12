"use client";

type Match={id:string;round_name:string|null;home_name:string|null;away_name:string|null;home_score:number|null;away_score:number|null;status:string};
const ORDER=["Round of 12","Quarter-finals","Semi-finals","Final"];
export default function CompetitionBracket({matches}:{matches:Match[]}){
 const rounds=ORDER.map(name=>({name,matches:matches.filter(m=>m.round_name===name)})).filter(r=>r.matches.length);
 if(!rounds.length)return <div className="empty-state"><h3>Knockout bracket not generated yet</h3><p>It will appear automatically after every group-stage fixture has been confirmed.</p></div>;
 return <div className="bracket-wrap">{rounds.map(round=><section className="bracket-round" key={round.name}><h3>{round.name}</h3>{round.matches.map(m=><article className="bracket-match" key={m.id}><div className="bracket-team"><span>{m.home_name||"TBC"}</span><b>{m.home_score??"—"}</b></div><div className="bracket-team"><span>{m.away_name||"TBC"}</span><b>{m.away_score??"—"}</b></div><small>{m.status}</small></article>)}</section>)}</div>;
}
