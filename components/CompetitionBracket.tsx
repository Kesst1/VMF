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

type Theme = "champions" | "europa" | "classic";

function MatchCard({ match }: { match: Match }) {
  const homeWon = match.status === "confirmed" && Number(match.home_score) > Number(match.away_score);
  const awayWon = match.status === "confirmed" && Number(match.away_score) > Number(match.home_score);
  return (
    <article className="vmf-bracket-match">
      <div className={`vmf-bracket-team ${homeWon ? "winner" : ""}`}><span>{match.home_name || "TBD"}</span><b>{match.home_score ?? "—"}</b></div>
      <div className={`vmf-bracket-team ${awayWon ? "winner" : ""}`}><span>{match.away_name || "TBD"}</span><b>{match.away_score ?? "—"}</b></div>
      <small>{match.status === "confirmed" ? "FULL TIME" : match.status.toUpperCase()}</small>
    </article>
  );
}

export default function CompetitionBracket({ matches, theme = "classic" }: { matches: Match[]; theme?: Theme }) {
  const roundOf12 = matches.filter(m => m.round_name === "Round of 12");
  const quarters = matches.filter(m => m.round_name === "Quarter-finals");
  const semis = matches.filter(m => m.round_name === "Semi-finals");
  const final = matches.filter(m => m.round_name === "Final");
  const opening = roundOf12.length ? roundOf12 : quarters;
  const split = Math.ceil(opening.length / 2);
  const leftOpening = opening.slice(0, split);
  const rightOpening = opening.slice(split);
  const leftSemi = semis.slice(0, 1);
  const rightSemi = semis.slice(1, 2);

  if (!matches.length) return <div className="empty-state"><h3>Knockout bracket not generated yet</h3><p>It will appear automatically when all group-stage fixtures have been confirmed.</p></div>;

  return (
    <div className={`vmf-bracket-shell theme-${theme}`}>
      <div className="vmf-bracket-topline"><span>TOURNAMENT BRACKET</span><span>VMF · KNOCKOUT STAGE</span></div>
      <div className="vmf-bracket-heading"><span>{roundOf12.length ? "ROUND OF 12" : "QUARTER-FINALS"}</span><span>SEMI-FINALS</span><span>FINAL</span><span>SEMI-FINALS</span><span>{roundOf12.length ? "ROUND OF 12" : "QUARTER-FINALS"}</span></div>
      <div className="vmf-bracket-grid">
        <section className="vmf-bracket-round outer left">{leftOpening.map(m => <MatchCard key={m.id} match={m} />)}</section>
        <section className="vmf-bracket-round inner left">{leftSemi.map(m => <MatchCard key={m.id} match={m} />)}{!leftSemi.length && <div className="vmf-bracket-placeholder">Winner of this side</div>}</section>
        <section className="vmf-bracket-center">{final.length ? final.map(m => <MatchCard key={m.id} match={m} />) : <div className="vmf-bracket-placeholder">FINAL<br/>Awaiting finalists</div>}</section>
        <section className="vmf-bracket-round inner right">{rightSemi.map(m => <MatchCard key={m.id} match={m} />)}{!rightSemi.length && <div className="vmf-bracket-placeholder">Winner of this side</div>}</section>
        <section className="vmf-bracket-round outer right">{rightOpening.map(m => <MatchCard key={m.id} match={m} />)}</section>
      </div>
      <style jsx>{`
        .vmf-bracket-shell{--bracket-accent:#17191d;--bracket-accent-soft:#f1f2f3;position:relative;overflow:hidden;border:1px solid #e6e7e9;border-radius:18px;padding:22px;background:linear-gradient(145deg,#fff 0%,#f8f8f8 100%);color:#17191d}
        .theme-champions{--bracket-accent:#173b72;--bracket-accent-soft:#edf3fb;background:linear-gradient(145deg,#f8fbff,#eaf1fb);border-color:#d8e2f0}
        .theme-europa{--bracket-accent:#167344;--bracket-accent-soft:#edf8f1;background:linear-gradient(145deg,#fbfffc,#eaf6ee);border-color:#d7eadc}
        .vmf-bracket-topline{display:flex;justify-content:space-between;gap:12px;padding-bottom:16px;border-bottom:1px solid color-mix(in srgb,var(--bracket-accent) 18%,transparent);font-size:9px;font-weight:900;letter-spacing:.16em;color:var(--bracket-accent)}
        .vmf-bracket-heading{display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr 1.2fr;gap:18px;margin:20px 0 13px;text-align:center;color:var(--bracket-accent);font-size:9px;font-weight:900;letter-spacing:.12em}
        .vmf-bracket-grid{display:grid;grid-template-columns:minmax(130px,1.2fr) minmax(120px,1fr) minmax(145px,1fr) minmax(120px,1fr) minmax(130px,1.2fr);gap:18px;align-items:center;min-height:300px}
        .vmf-bracket-round{position:relative;display:flex;flex-direction:column;justify-content:space-around;gap:22px;min-width:0;height:100%;padding:10px 0}
        .vmf-bracket-round.outer:after{content:"";position:absolute;top:25%;bottom:25%;width:12px;border-top:1.5px solid var(--bracket-accent);border-bottom:1.5px solid var(--bracket-accent);opacity:.45;pointer-events:none}
        .vmf-bracket-round.outer.left:after{right:-18px;border-right:1.5px solid var(--bracket-accent)}
        .vmf-bracket-round.outer.right:after{left:-18px;border-left:1.5px solid var(--bracket-accent)}
        .vmf-bracket-round.inner:before{content:"";position:absolute;top:50%;width:18px;border-top:1.5px solid var(--bracket-accent);opacity:.45}
        .vmf-bracket-round.inner.left:before{right:-18px}.vmf-bracket-round.inner.right:before{left:-18px}
        .vmf-bracket-match{position:relative;z-index:1;border:1px solid color-mix(in srgb,var(--bracket-accent) 20%,#fff);border-radius:7px;background:#fff;padding:9px 11px;min-width:0;box-shadow:0 5px 16px #1018280b}
        .vmf-bracket-team{display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:25px;padding:4px 0;font-size:11px;color:#555;min-width:0}.vmf-bracket-team+.vmf-bracket-team{border-top:1px solid #eceef0}.vmf-bracket-team span{overflow-wrap:anywhere}.vmf-bracket-team b{font-variant-numeric:tabular-nums;color:#202329}.vmf-bracket-team.winner span,.vmf-bracket-team.winner b{font-weight:900;color:var(--bracket-accent)}
        .vmf-bracket-match small{display:block;margin-top:6px;padding-top:5px;border-top:1px solid #f0f1f2;color:#92969c;font-size:7px;font-weight:900;letter-spacing:.13em}
        .vmf-bracket-center{position:relative;z-index:1;display:flex;flex-direction:column;justify-content:center;gap:12px;min-width:0;text-align:center}.vmf-bracket-center:before,.vmf-bracket-center:after{content:"";position:absolute;top:50%;width:18px;border-top:1.5px solid var(--bracket-accent);opacity:.45}.vmf-bracket-center:before{left:-18px}.vmf-bracket-center:after{right:-18px}
        .vmf-bracket-placeholder{border:1px dashed color-mix(in srgb,var(--bracket-accent) 40%,#fff);border-radius:7px;padding:22px 8px;background:var(--bracket-accent-soft);color:var(--bracket-accent);font-size:10px;font-weight:800;line-height:1.7;text-align:center}
        @media(max-width:760px){.vmf-bracket-shell{overflow-x:auto}.vmf-bracket-topline,.vmf-bracket-heading,.vmf-bracket-grid{min-width:780px}.vmf-bracket-grid{min-height:280px}}
      `}</style>
    </div>
  );
}
