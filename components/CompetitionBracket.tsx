"use client";

type Match = {
  id: string;
  round_name: string | null;
  home_name: string | null;
  away_name: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
};

const ORDER = ["Round of 12", "Quarter-finals", "Semi-finals", "Final"];

function MatchCard({ match }: { match: Match }) {
  const homeWon = match.status === "confirmed" && Number(match.home_score) > Number(match.away_score);
  const awayWon = match.status === "confirmed" && Number(match.away_score) > Number(match.home_score);
  return (
    <article className="vmf-bracket-match">
      <div className={`vmf-bracket-team ${homeWon ? "winner" : ""}`}>
        <span>{match.home_name || "TBD"}</span><b>{match.home_score ?? "—"}</b>
      </div>
      <div className={`vmf-bracket-team ${awayWon ? "winner" : ""}`}>
        <span>{match.away_name || "TBD"}</span><b>{match.away_score ?? "—"}</b>
      </div>
      <small>{match.status === "confirmed" ? "FULL TIME" : match.status.toUpperCase()}</small>
    </article>
  );
}

export default function CompetitionBracket({ matches }: { matches: Match[] }) {
  const rounds = ORDER.map(name => ({ name, matches: matches.filter(m => m.round_name === name) }));
  const quarters = rounds.find(r => r.name === "Quarter-finals")?.matches || [];
  const roundOf12 = rounds.find(r => r.name === "Round of 12")?.matches || [];
  const semis = rounds.find(r => r.name === "Semi-finals")?.matches || [];
  const final = rounds.find(r => r.name === "Final")?.matches || [];

  if (!matches.length) return <div className="empty-state"><h3>Knockout bracket not generated yet</h3><p>It will appear automatically when all group-stage fixtures have been confirmed.</p></div>;

  const leftQuarter = (roundOf12.length ? roundOf12 : quarters).slice(0, 2);
  const rightQuarter = (roundOf12.length ? roundOf12 : quarters).slice(2, 4);
  const leftSemi = semis[0] ? [semis[0]] : [];
  const rightSemi = semis[1] ? [semis[1]] : [];

  return (
    <div className="vmf-bracket-shell">
      <div className="vmf-bracket-heading"><span>LEFT PATH</span><span>CHAMPIONSHIP</span><span>RIGHT PATH</span></div>
      <div className="vmf-bracket-grid">
        <section className="vmf-bracket-side left">
          <div className="vmf-bracket-round"><h3>{roundOf12.length ? "Round of 12" : "Quarter-finals"}</h3>{leftQuarter.map(m => <MatchCard key={m.id} match={m} />)}</div>
          <div className="vmf-bracket-round"><h3>Semi-final</h3>{leftSemi.map(m => <MatchCard key={m.id} match={m} />)}</div>
        </section>
        <section className="vmf-bracket-center"><h3>FINAL</h3>{final.length ? final.map(m => <MatchCard key={m.id} match={m} />) : <div className="vmf-bracket-placeholder">Winner of each side</div>}</section>
        <section className="vmf-bracket-side right">
          <div className="vmf-bracket-round"><h3>{roundOf12.length ? "Round of 12" : "Quarter-finals"}</h3>{rightQuarter.map(m => <MatchCard key={m.id} match={m} />)}</div>
          <div className="vmf-bracket-round"><h3>Semi-final</h3>{rightSemi.map(m => <MatchCard key={m.id} match={m} />)}</div>
        </section>
      </div>
      <style jsx>{`
        .vmf-bracket-shell{border:1px solid var(--line);border-radius:18px;background:var(--surface);padding:20px;overflow:hidden}
        .vmf-bracket-heading{display:grid;grid-template-columns:1fr 180px 1fr;gap:18px;margin-bottom:20px;color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.14em;text-align:center}
        .vmf-bracket-grid{display:grid;grid-template-columns:minmax(0,1fr) 180px minmax(0,1fr);gap:18px;align-items:center}
        .vmf-bracket-side{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:center;min-width:0}
        .vmf-bracket-side.right{direction:rtl}.vmf-bracket-side.right>*{direction:ltr}
        .vmf-bracket-round{display:flex;flex-direction:column;gap:12px;min-width:0}.vmf-bracket-round h3,.vmf-bracket-center h3{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin:0 0 3px}
        .vmf-bracket-match{border:1px solid var(--line);border-radius:11px;padding:10px 11px;background:var(--surface);min-width:0;box-shadow:0 4px 14px #00000008}
        .vmf-bracket-team{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:6px 0;font-size:12px}.vmf-bracket-team+ .vmf-bracket-team{border-top:1px solid var(--line)}.vmf-bracket-team span{overflow-wrap:anywhere}.vmf-bracket-team b{font-variant-numeric:tabular-nums}.vmf-bracket-team.winner span,.vmf-bracket-team.winner b{font-weight:900;color:#15803d}
        .vmf-bracket-match small{display:block;margin-top:6px;color:var(--muted);font-size:8px;letter-spacing:.12em}
        .vmf-bracket-center{display:flex;flex-direction:column;gap:12px;justify-content:center;text-align:center;min-width:0}.vmf-bracket-center h3{font-size:12px;color:var(--foreground)}.vmf-bracket-placeholder{border:1px dashed var(--line);border-radius:12px;padding:24px 10px;color:var(--muted);font-size:11px}
        @media(max-width:850px){.vmf-bracket-shell{overflow-x:auto}.vmf-bracket-grid,.vmf-bracket-heading{min-width:760px}.vmf-bracket-grid{grid-template-columns:minmax(0,1fr) 150px minmax(0,1fr)}.vmf-bracket-heading{grid-template-columns:1fr 150px 1fr}}
      `}</style>
    </div>
  );
}
