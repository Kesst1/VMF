"use client";
type Match = { id: string; round_name: string | null; home_name: string | null; away_name: string | null; home_score: number | null; away_score: number | null; status: string };
type Theme = "champions" | "europa" | "classic";
function MatchCard({ match }: { match: Match }) {
  const confirmed = match.status === "confirmed";
  const homeWon = confirmed && Number(match.home_score) > Number(match.away_score);
  const awayWon = confirmed && Number(match.away_score) > Number(match.home_score);
  return <article className="vmf-bracket-match">
    <div className={`vmf-bracket-team ${homeWon ? "winner" : ""}`}><span>{match.home_name || "TBD"}</span><b>{match.home_score ?? "—"}</b></div>
    <div className={`vmf-bracket-team ${awayWon ? "winner" : ""}`}><span>{match.away_name || "TBD"}</span><b>{match.away_score ?? "—"}</b></div>
    <small>{confirmed ? "FULL TIME" : (match.status || "SCHEDULED").toUpperCase()}</small>
  </article>;
}
const ROUND_ORDER = ["Round of 32", "Round of 16", "Round of 12", "Play-off", "Quarter-finals", "Semi-finals", "Final"];
const ROUND_LABEL: Record<string, string> = { "Round of 32": "ROUND OF 32", "Round of 16": "ROUND OF 16", "Round of 12": "ROUND OF 12", "Play-off": "PLAY-OFFS", "Quarter-finals": "QUARTER-FINALS", "Semi-finals": "SEMI-FINALS", Final: "FINAL" };
function RoundColumn({ name, matches, side }: { name: string; matches: Match[]; side: "left" | "right" }) {
  return <section className={`vmf-bracket-round ${side}`}><h3>{ROUND_LABEL[name] || name.toUpperCase()}</h3><div className="vmf-bracket-round-matches">{matches.map(m => <MatchCard key={m.id} match={m} />)}</div></section>;
}
export default function CompetitionBracket({ matches, theme = "classic", uefa = false }: { matches: Match[]; theme?: Theme; uefa?: boolean }) {
  if (!matches.length) return <div className="empty-state"><h3>Knockout bracket not generated yet</h3><p>{uefa ? "It will appear after all UEFA league-phase fixtures have been confirmed." : "It will appear automatically when all group-stage fixtures have been confirmed."}</p></div>;
  const availableRounds = ROUND_ORDER.filter(round => matches.some(m => (m.round_name || "").toLowerCase() === round.toLowerCase()));
  const rounds = availableRounds.length ? availableRounds : [...new Set(matches.map(m => m.round_name || "Knockout"))];
  const finalRound = rounds.find(r => r.toLowerCase() === "final");
  const finalMatches = finalRound ? matches.filter(m => (m.round_name || "").toLowerCase() === finalRound.toLowerCase()) : [];
  const playingRounds = rounds.filter(r => r !== finalRound);
  const leftColumns = playingRounds.map(round => ({ round, matches: matches.filter(m => (m.round_name || "Knockout").toLowerCase() === round.toLowerCase()) })).map(item => ({ ...item, matches: item.matches.slice(0, Math.ceil(item.matches.length / 2)) }));
  const rightColumns = playingRounds.map(round => ({ round, matches: matches.filter(m => (m.round_name || "Knockout").toLowerCase() === round.toLowerCase()) })).map(item => ({ ...item, matches: item.matches.slice(Math.ceil(item.matches.length / 2)).reverse() })).reverse();
  return <div className={`vmf-bracket-shell theme-${theme} ${uefa ? "vmf-bracket-uefa" : ""}`}>
    <div className="vmf-bracket-topline"><span>{uefa ? "UEFA TOURNAMENT BRACKET" : "TOURNAMENT BRACKET"}</span><span>ROAD TO THE FINAL</span></div>
    <div className="vmf-bracket-tree">
      <div className="vmf-bracket-side vmf-bracket-left">{leftColumns.map(c => <RoundColumn key={`L-${c.round}`} name={c.round} matches={c.matches} side="left" />)}</div>
      <section className="vmf-bracket-final"><h3>FINAL</h3><div className="vmf-bracket-final-matches">{finalMatches.length ? finalMatches.map(m => <MatchCard key={m.id} match={m} />) : <div className="vmf-bracket-final-placeholder">Awaiting finalists</div>}</div></section>
      <div className="vmf-bracket-side vmf-bracket-right">{rightColumns.map(c => <RoundColumn key={`R-${c.round}`} name={c.round} matches={c.matches} side="right" />)}</div>
    </div>
  </div>;
}
