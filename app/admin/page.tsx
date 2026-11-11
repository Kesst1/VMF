"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeading } from "@/components/SiteShell";

type Competition = { id: string; name: string; season?: string | null };
type Fixture = { id: string; fixture_code: string; competition_id: string; home_name: string; away_name: string; home_score?: number | null; away_score?: number | null; status: string; matchday?: number | null; };

export default function Admin() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [competitionId, setCompetitionId] = useState("");
  const [fixtureId, setFixtureId] = useState("");
  const [fixtureSearch, setFixtureSearch] = useState("");
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [homeScore, setHomeScore] = useState("0");
  const [awayScore, setAwayScore] = useState("0");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/competitions").then(r => r.json()).then(d => setCompetitions(d.competitions || [])).catch(() => setMessage("No se pudieron cargar las competiciones."));
  }, []);
  useEffect(() => {
    setFixtures([]);
    setFixtureId("");
    setFixtureSearch("");
    if (!competitionId) return;

    let active = true;
    setLoadingFixtures(true);
    fetch(`/api/fixtures?competition=${encodeURIComponent(competitionId)}`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No se pudieron cargar los fixtures.");
        return data;
      })
      .then(data => {
        if (!active) return;
        const available = (data.fixtures || []).filter((f: Fixture) => !["confirmed", "cancelled"].includes(f.status));
        setFixtures(available);
      })
      .catch(error => {
        if (active) setMessage(error instanceof Error ? error.message : "No se pudieron cargar los fixtures.");
      })
      .finally(() => { if (active) setLoadingFixtures(false); });

    return () => { active = false; };
  }, [competitionId]);

  const selectedFixture = useMemo(() => fixtures.find(f => f.id === fixtureId), [fixtures, fixtureId]);
  const filteredFixtures = useMemo(() => {
    const query = fixtureSearch.trim().toLowerCase();
    if (!query) return fixtures;
    return fixtures.filter(f =>
      `${f.fixture_code} ${f.home_name} ${f.away_name} ${f.matchday ? `md ${f.matchday}` : ""}`.toLowerCase().includes(query)
    );
  }, [fixtures, fixtureSearch]);
  async function submitResult() {
    if (!fixtureId) { setMessage("Selecciona un fixture."); return; }
    const h = Number(homeScore), a = Number(awayScore);
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0 || h > 99 || a > 99) { setMessage("Introduce goles válidos (0–99)."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/matches/report", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", cache: "no-store", body: JSON.stringify({ fixture_id: fixtureId, home_score: h, away_score: a }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar el resultado.");
      setMessage(`Resultado guardado y confirmado: ${data.fixture.fixture_code || selectedFixture?.fixture_code || "fixture"}.`);
      setFixtures(current => current.filter(f => f.id !== fixtureId)); setFixtureId(""); setHomeScore("0"); setAwayScore("0");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Error inesperado."); }
    finally { setBusy(false); }
  }

  return <main className="container">
    <PageHeading eyebrow="VMF MANAGEMENT" title="Admin workspace." description="Gestiona resultados y fixtures desde un único panel protegido." />
    <section className="content-section">
      <div className="dark-band"><h2>Match results.</h2><p>Selecciona la competición y el encuentro, introduce el marcador y envíalo. El resultado se guarda y confirma en una sola acción.</p></div>
      <div className="feature-card" style={{ maxWidth: 760, marginTop: 24 }}>
        <label className="admin-label" htmlFor="competition">Competition</label>
        <select id="competition" className="admin-input" value={competitionId} onChange={e => setCompetitionId(e.target.value)}>
          <option value="">Select a competition</option>{competitions.map(c => <option key={c.id} value={c.id}>{c.name}{c.season ? ` · ${c.season}` : ""}</option>)}
        </select>
        <label className="admin-label" htmlFor="fixture-search">Find a fixture</label>
        <input
          id="fixture-search"
          className="admin-input"
          type="search"
          value={fixtureSearch}
          onChange={e => setFixtureSearch(e.target.value)}
          placeholder="Search by team, fixture code or matchday…"
          disabled={!competitionId || loadingFixtures || !fixtures.length}
        />
        <label className="admin-label" htmlFor="fixture">Select exact match</label>
        <select id="fixture" className="admin-input" value={fixtureId} onChange={e => { setFixtureId(e.target.value); setHomeScore("0"); setAwayScore("0"); }} disabled={!competitionId || loadingFixtures || !filteredFixtures.length}>
          <option value="">{loadingFixtures ? "Loading fixtures…" : !fixtures.length ? "No pending fixtures in this competition" : !filteredFixtures.length ? "No matches found" : "Choose a fixture"}</option>
          {filteredFixtures.map(f => <option key={f.id} value={f.id}>{f.fixture_code} · {f.home_name} vs {f.away_name}{f.matchday ? ` · MD ${f.matchday}` : ""}</option>)}
        </select>
        {competitionId && !loadingFixtures && <p className="fixture-count">{fixtures.length} pending {fixtures.length === 1 ? "fixture" : "fixtures"}{fixtureSearch.trim() ? ` · ${filteredFixtures.length} matching your search` : " available"}</p>}
        {selectedFixture && <div className="selected-match">
          <span className="selected-match-label">SELECTED MATCH</span>
          <div className="selected-teams"><strong>{selectedFixture.home_name}</strong><span>VS</span><strong>{selectedFixture.away_name}</strong></div>
          <span className="selected-match-meta">{selectedFixture.fixture_code}{selectedFixture.matchday ? ` · Matchday ${selectedFixture.matchday}` : ""}</span>
        </div>}
        <div className="admin-score-grid">
          <div><label className="admin-label" htmlFor="home-score">{selectedFixture?.home_name || "Home team"}</label><input id="home-score" className="admin-input score-input" type="number" min="0" max="99" step="1" value={homeScore} onChange={e => setHomeScore(e.target.value)} disabled={!selectedFixture} /></div>
          <div className="score-separator">–</div>
          <div><label className="admin-label" htmlFor="away-score">{selectedFixture?.away_name || "Away team"}</label><input id="away-score" className="admin-input score-input" type="number" min="0" max="99" step="1" value={awayScore} onChange={e => setAwayScore(e.target.value)} disabled={!selectedFixture} /></div>
        </div>
        <button className="admin-submit" type="button" onClick={submitResult} disabled={busy || !fixtureId}>{busy ? "Submitting…" : "Submit & Confirm"}</button>
        {message && <p className="admin-message" role="status">{message}</p>}
      </div>
      <div className="notice" style={{ marginTop: 20 }}>Sesión protegida mediante Discord OAuth. Los permisos se verifican en el servidor con los roles actuales de VMF.</div>
    </section>
    <style jsx>{`
      .admin-label{display:block;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:18px 0 8px;color:var(--foreground)}
      .admin-input{width:100%;min-height:46px;padding:11px 13px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--foreground);font:inherit}
      .fixture-count{margin:8px 0 0;color:var(--muted);font-size:12px}
      .selected-match{margin:18px 0 12px;padding:18px;border:1px solid var(--border);border-radius:14px;background:var(--surface)}
      .selected-match-label{display:block;font-size:10px;font-weight:800;letter-spacing:.14em;color:var(--muted);margin-bottom:12px}
      .selected-teams{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;text-align:center}
      .selected-teams strong{font-size:16px;overflow-wrap:anywhere}
      .selected-teams span{font-size:10px;font-weight:800;color:var(--muted);letter-spacing:.1em}
      .selected-match-meta{display:block;text-align:center;color:var(--muted);font-size:11px;margin-top:10px}
      .admin-score-grid{display:grid;grid-template-columns:1fr 30px 1fr;gap:12px;align-items:end;margin-top:8px}
      .score-input{text-align:center;font-size:26px;font-weight:800}
      .score-input:disabled{opacity:.55;cursor:not-allowed}
      .score-separator{text-align:center;font-size:24px;padding-bottom:8px}
      .admin-submit{width:100%;margin-top:22px;padding:14px 18px;border:0;border-radius:10px;background:#111;color:white;font-weight:800;cursor:pointer}
      .admin-submit:disabled{opacity:.5;cursor:not-allowed}
      .admin-message{margin-top:16px;font-weight:600}
    `}</style>
  </main>;
}
