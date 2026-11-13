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

const ROUND_ORDER = ["Round of 16", "Round of 12", "Play-off", "Quarter-finals", "Semi-finals", "Final"];
const ROUND_LABEL: Record<string, string> = { "Round of 16": "ROUND OF 16", "Round of 12": "ROUND OF 12", "Play-off": "PLAY-OFFS", "Quarter-finals": "QUARTER-FINALS", "Semi-finals": "SEMI-FINALS", Final: "FINAL" };

export default function CompetitionBracket({ matches, theme = "classic", uefa = false }: { matches: Match[]; theme?: Theme; uefa?: boolean }) {
  if (!matches.length) return <div className="empty-state"><h3>Knockout bracket not generated yet</h3><p>{uefa ? "It will appear after all UEFA league-phase fixtures have been confirmed." : "It will appear automatically when all group-stage fixtures have been confirmed."}</p></div>;

  const availableRounds = ROUND_ORDER.filter(round => matches.some(m => (m.round_name || "").toLowerCase() === round.toLowerCase()));
  const rounds = availableRounds.length ? availableRounds : [...new Set(matches.map(m => m.round_name || "Knockout"))];
  return <div className={`vmf-bracket-shell theme-${theme} ${uefa ? "vmf-bracket-uefa" : ""}`}>
    <div className="vmf-bracket-topline"><span>{uefa ? "UEFA TOURNAMENT BRACKET" : "TOURNAMENT BRACKET"}</span><span>ROAD TO THE FINAL</span></div>
    <div className="vmf-bracket-grid" style={{ "--bracket-rounds": rounds.length } as React.CSSProperties}>
      {rounds.map(round => {
        const roundMatches = matches.filter(m => (m.round_name || "Knockout").toLowerCase() === round.toLowerCase());
        return <section className={`vmf-bracket-round ${round.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} key={round}>
          <h3>{ROUND_LABEL[round] || round.toUpperCase()}</h3>
          <div className="vmf-bracket-round-matches">{roundMatches.map(m => <MatchCard key={m.id} match={m} />)}</div>
        </section>;
      })}
    </div>
  </div>;
}
