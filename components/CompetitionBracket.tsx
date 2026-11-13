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

export default function CompetitionBracket({ matches, theme = "classic", uefa = false }: { matches: Match[]; theme?: Theme; uefa?: boolean }) {
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

  if (!matches.length) return <div className="empty-state"><h3>Knockout bracket not generated yet</h3><p>{uefa ? "It will appear after all UEFA league-phase fixtures have been confirmed." : "It will appear automatically when all group-stage fixtures have been confirmed."}</p></div>;

  if (uefa) {
    const rounds = ["Repechage", "Play-off", "Quarter-finals", "Semi-finals", "Final"];
    return (
      <div className={`vmf-bracket-shell theme-${theme}`}>
      <div className="vmf-bracket-topline"><span>UEFA TOURNAMENT BRACKET</span><span>ROAD TO THE FINAL</span></div>
      <div className="vmf-uefa-rounds">{rounds.map(round => {
        const roundMatches = matches.filter(m => m.round_name === round);
        return <section className="vmf-uefa-round" key={round}><h3>{round.toUpperCase()}</h3>{roundMatches.length ? roundMatches.map(m => <MatchCard key={m.id} match={m} />) : <div className="vmf-bracket-placeholder">Awaiting qualification</div>}</section>;
      })}</div>
      
      </div>
    );
  }

  return (
    <div className={`vmf-bracket-shell theme-${theme}`}>
      <div className="vmf-bracket-topline"><span>TOURNAMENT BRACKET</span><span>ROAD TO THE FINAL</span></div>
      <div className="vmf-bracket-heading"><span>{roundOf12.length ? "ROUND OF 12" : "QUARTER-FINALS"}</span><span>SEMI-FINALS</span><span>FINAL</span><span>SEMI-FINALS</span><span>{roundOf12.length ? "ROUND OF 12" : "QUARTER-FINALS"}</span></div>
      <div className="vmf-bracket-grid">
        <section className="vmf-bracket-round outer left">{leftOpening.map(m => <MatchCard key={m.id} match={m} />)}</section>
        <section className="vmf-bracket-round inner left">{leftSemi.map(m => <MatchCard key={m.id} match={m} />)}{!leftSemi.length && <div className="vmf-bracket-placeholder">Winner of this side</div>}</section>
        <section className="vmf-bracket-center">{final.length ? final.map(m => <MatchCard key={m.id} match={m} />) : <div className="vmf-bracket-placeholder">FINAL<br/>Awaiting finalists</div>}</section>
        <section className="vmf-bracket-round inner right">{rightSemi.map(m => <MatchCard key={m.id} match={m} />)}{!rightSemi.length && <div className="vmf-bracket-placeholder">Winner of this side</div>}</section>
        <section className="vmf-bracket-round outer right">{rightOpening.map(m => <MatchCard key={m.id} match={m} />)}</section>
      </div>
    </div>
  );
}
