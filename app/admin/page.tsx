"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeading } from "@/components/SiteShell";

type Competition = { id: string; name: string; season?: string | null };
type Fixture = { id: string; fixture_code: string; competition_id: string; home_name: string; away_name: string; home_score?: number | null; away_score?: number | null; status: string; matchday?: number | null; };

export default function Admin() {
  const [key, setKey] = useState("");
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [competitionId, setCompetitionId] = useState("");
  const [fixtureId, setFixtureId] = useState("");
  const [homeScore, setHomeScore] = useState("0");
  const [awayScore, setAwayScore] = useState("0");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { setKey(sessionStorage.getItem("vmf-admin-key") || ""); }, []);
  useEffect(() => {
    fetch("/api/competitions").then(r => r.json()).then(d => setCompetitions(d.competitions || [])).catch(() => setMessage("No se pudieron cargar las competiciones."));
  }, []);
  useEffect(() => {
    if (!competitionId) { setFixtures([]); setFixtureId(""); return; }
    fetch(`/api/fixtures?competition=${encodeURIComponent(competitionId)}`).then(r => r.json()).then(d => {
      const available = (d.fixtures || []).filter((f: Fixture) => !["confirmed", "cancelled"].includes(f.status));
      setFixtures(available); setFixtureId(available[0]?.id || "");
    }).catch(() => setMessage("No se pudieron cargar los fixtures."));
  }, [competitionId]);

  const selectedFixture = useMemo(() => fixtures.find(f => f.id === fixtureId), [fixtures, fixtureId]);
  async function submitResult() {
    if (!key.trim()) { setMessage("Introduce tu clave de administrador."); return; }
    if (!fixtureId) { setMessage("Selecciona un fixture."); return; }
    const h = Number(homeScore), a = Number(awayScore);
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0 || h > 99 || a > 99) { setMessage("Introduce goles válidos (0–99)."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/matches/report", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-api-key": key }, body: JSON.stringify({ fixture_id: fixtureId, home_score: h, away_score: a }) });
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
        <label className="admin-label" htmlFor="admin-key">Admin API key</label>
        <input id="admin-key" className="admin-input" type="password" autoComplete="current-password" value={key} onChange={e => { setKey(e.target.value); sessionStorage.setItem("vmf-admin-key", e.target.value); }} placeholder="Introduce ADMIN_API_KEY" />
        <label className="admin-label" htmlFor="competition">Competition</label>
        <select id="competition" className="admin-input" value={competitionId} onChange={e => setCompetitionId(e.target.value)}>
          <option value="">Select a competition</option>{competitions.map(c => <option key={c.id} value={c.id}>{c.name}{c.season ? ` · ${c.season}` : ""}</option>)}
        </select>
        <label className="admin-label" htmlFor="fixture">Fixture</label>
        <select id="fixture" className="admin-input" value={fixtureId} onChange={e => setFixtureId(e.target.value)} disabled={!fixtures.length}>
          {!fixtures.length && <option value="">No pending fixtures</option>}
          {fixtures.map(f => <option key={f.id} value={f.id}>{f.fixture_code} · {f.home_name} vs {f.away_name}{f.matchday ? ` · MD ${f.matchday}` : ""}</option>)}
        </select>
        {selectedFixture && <div className="muted" style={{ margin: "8px 0 18px" }}>{selectedFixture.home_name} vs {selectedFixture.away_name}</div>}
        <div className="admin-score-grid">
          <div><label className="admin-label" htmlFor="home-score">{selectedFixture?.home_name || "Home"}</label><input id="home-score" className="admin-input score-input" type="number" min="0" max="99" step="1" value={homeScore} onChange={e => setHomeScore(e.target.value)} /></div>
          <div className="score-separator">–</div>
          <div><label className="admin-label" htmlFor="away-score">{selectedFixture?.away_name || "Away"}</label><input id="away-score" className="admin-input score-input" type="number" min="0" max="99" step="1" value={awayScore} onChange={e => setAwayScore(e.target.value)} /></div>
        </div>
        <button className="admin-submit" type="button" onClick={submitResult} disabled={busy || !fixtureId}>{busy ? "Submitting…" : "Submit & Confirm"}</button>
        {message && <p className="admin-message" role="status">{message}</p>}
      </div>
      <div className="notice" style={{ marginTop: 20 }}>La clave se guarda únicamente en la sesión de este navegador y se envía al servidor en cada operación. No se incluye en el código público.</div>
    </section>
    <style jsx>{`
      .admin-label{display:block;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:18px 0 8px;color:var(--foreground)}
      .admin-input{width:100%;min-height:46px;padding:11px 13px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--foreground);font:inherit}
      .admin-score-grid{display:grid;grid-template-columns:1fr 30px 1fr;gap:12px;align-items:end;margin-top:8px}
      .score-input{text-align:center;font-size:26px;font-weight:800}
      .score-separator{text-align:center;font-size:24px;padding-bottom:8px}
      .admin-submit{width:100%;margin-top:22px;padding:14px 18px;border:0;border-radius:10px;background:#111;color:white;font-weight:800;cursor:pointer}
      .admin-submit:disabled{opacity:.5;cursor:not-allowed}
      .admin-message{margin-top:16px;font-weight:600}
    `}</style>
  </main>;
}
