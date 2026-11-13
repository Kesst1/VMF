"use client";

import { useEffect, useMemo, useState } from "react";

type Competition = { id: string; name: string; season?: string | null };
type Fixture = { id: string; fixture_code: string; competition_id: string; home_name: string; away_name: string; status: string; matchday?: number | null; round_name?: string | null };

export default function AdminMatchResults() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [competitionId, setCompetitionId] = useState("");
  const [fixtureId, setFixtureId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [homeScore, setHomeScore] = useState("0");
  const [awayScore, setAwayScore] = useState("0");
  const [scorers, setScorers] = useState("");
  const [assists, setAssists] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { fetch("/api/competitions").then(r => r.json()).then(d => setCompetitions(d.competitions || [])).catch(() => setMessage("Could not load competitions.")); }, []);
  useEffect(() => {
    setFixtures([]); setFixtureId(""); setSearch("");
    if (!competitionId) return;
    let active = true; setLoading(true);
    fetch(`/api/fixtures?competition=${encodeURIComponent(competitionId)}`).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Could not load fixtures."); return d; })
      .then(d => { if (active) setFixtures((d.fixtures || []).filter((f: Fixture) => !["confirmed", "cancelled"].includes(f.status))); })
      .catch(e => { if (active) setMessage(e instanceof Error ? e.message : "Could not load fixtures."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [competitionId]);
  const selected = useMemo(() => fixtures.find(f => f.id === fixtureId), [fixtures, fixtureId]);
  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); return q ? fixtures.filter(f => `${f.fixture_code} ${f.home_name} ${f.away_name} ${f.matchday || ""} ${f.round_name || ""}`.toLowerCase().includes(q)) : fixtures; }, [fixtures, search]);
  async function submit() {
    if (!selected) return setMessage("Select a fixture.");
    const h = Number(homeScore), a = Number(awayScore);
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0 || h > 99 || a > 99) return setMessage("Enter valid scores (0–99).");
    setBusy(true); setMessage("");
    try {
      const r = await fetch("/api/admin/matches/report", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", cache: "no-store", body: JSON.stringify({ fixture_id: fixtureId, home_score: h, away_score: a, goal_scorers: scorers.split(/[\n,]+/).map(v => v.trim()).filter(Boolean), assists: assists.split(/[\n,]+/).map(v => v.trim()).filter(Boolean) }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Could not save result.");
      setMessage(`Result confirmed: ${d.fixture.fixture_code || selected.fixture_code}.`); setFixtures(old => old.filter(f => f.id !== fixtureId)); setFixtureId(""); setHomeScore("0"); setAwayScore("0"); setScorers(""); setAssists("");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Unexpected error."); } finally { setBusy(false); }
  }
  return <section id="match-results" className="content-section admin-results-embed">
    <div className="dark-band"><h2>Match results</h2><p>Choose a competition and fixture, enter the score and confirm the result. The match is updated immediately.</p></div>
    <div className="feature-card admin-results-card">
      <label className="admin-label" htmlFor="result-competition">Competition</label>
      <select id="result-competition" className="admin-input" value={competitionId} onChange={e => setCompetitionId(e.target.value)}><option value="">Select a competition</option>{competitions.map(c => <option key={c.id} value={c.id}>{c.name}{c.season ? ` · ${c.season}` : ""}</option>)}</select>
      <label className="admin-label" htmlFor="result-search">Find a fixture</label><input id="result-search" className="admin-input" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team, fixture code or matchday…" disabled={!competitionId || loading || !fixtures.length}/>
      <label className="admin-label" htmlFor="result-fixture">Select match</label><select id="result-fixture" className="admin-input" value={fixtureId} onChange={e => { setFixtureId(e.target.value); setHomeScore("0"); setAwayScore("0"); }} disabled={!competitionId || loading || !filtered.length}><option value="">{loading ? "Loading…" : !fixtures.length ? "No pending fixtures" : !filtered.length ? "No matches found" : "Choose a fixture"}</option>{filtered.map(f => <option key={f.id} value={f.id}>{f.fixture_code} · {f.home_name} vs {f.away_name}{f.matchday ? ` · MD ${f.matchday}` : f.round_name ? ` · ${f.round_name}` : ""}</option>)}</select>
      {selected && <div className="selected-match"><span className="selected-match-label">SELECTED MATCH</span><div className="selected-teams"><strong>{selected.home_name}</strong><span>VS</span><strong>{selected.away_name}</strong></div><span className="selected-match-meta">{selected.fixture_code}{selected.matchday ? ` · Matchday ${selected.matchday}` : selected.round_name ? ` · ${selected.round_name}` : ""}</span></div>}
      <div className="admin-score-grid"><div><label className="admin-label">{selected?.home_name || "Home team"}</label><input className="admin-input score-input" type="number" min="0" max="99" value={homeScore} onChange={e => setHomeScore(e.target.value)} disabled={!selected}/></div><div className="score-separator">–</div><div><label className="admin-label">{selected?.away_name || "Away team"}</label><input className="admin-input score-input" type="number" min="0" max="99" value={awayScore} onChange={e => setAwayScore(e.target.value)} disabled={!selected}/></div></div>
      <label className="admin-label">Goal scorers · Roblox usernames</label><textarea className="admin-input event-input" value={scorers} onChange={e => setScorers(e.target.value)} placeholder="One username per goal" disabled={!selected}/><p className="fixture-count">One Roblox username per goal. No minutes required.</p>
      <label className="admin-label">Assists · Roblox usernames</label><textarea className="admin-input event-input" value={assists} onChange={e => setAssists(e.target.value)} placeholder="One username per assist" disabled={!selected}/><p className="fixture-count">Leave blank if no assists are recorded.</p>
      <button className="admin-submit" onClick={submit} disabled={busy || !selected}>{busy ? "Submitting…" : "Submit & Confirm"}</button>{message && <p className="admin-message" role="status">{message}</p>}
    </div>
    <style jsx>{`.admin-results-card{max-width:850px;margin-top:22px}.admin-label{display:block;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:18px 0 8px;color:var(--foreground)}.admin-input{width:100%;min-height:46px;padding:11px 13px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--foreground);font:inherit}.fixture-count{margin:8px 0 0;color:var(--muted);font-size:12px}.event-input{min-height:82px;resize:vertical}.selected-match{margin:18px 0 12px;padding:18px;border:1px solid var(--border);border-radius:14px;background:var(--surface)}.selected-match-label{display:block;font-size:10px;font-weight:800;letter-spacing:.14em;color:var(--muted);margin-bottom:12px}.selected-teams{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;text-align:center}.selected-teams strong{font-size:16px;overflow-wrap:anywhere}.selected-teams span{font-size:10px;font-weight:800;color:var(--muted)}.selected-match-meta{display:block;text-align:center;color:var(--muted);font-size:11px;margin-top:10px}.admin-score-grid{display:grid;grid-template-columns:1fr 30px 1fr;gap:12px;align-items:end;margin-top:8px}.score-input{text-align:center;font-size:26px;font-weight:800}.score-separator{text-align:center;font-size:24px;padding-bottom:8px}.admin-submit{width:100%;margin-top:22px;padding:14px 18px;border:0;border-radius:10px;background:#111;color:white;font-weight:800;cursor:pointer}.admin-submit:disabled{opacity:.5;cursor:not-allowed}.admin-message{margin-top:16px;font-weight:600}@media(max-width:560px){.selected-teams{grid-template-columns:1fr}.selected-teams span{display:none}}`}</style>
  </section>;
}
