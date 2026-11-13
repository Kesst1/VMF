"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeading } from "@/components/SiteShell";

type Competition = { id: string; name: string; season?: string | null; format?: string };
type Team = { id: string; name: string; group_name?: string | null };
type Fixture = { id: string; home_name: string; away_name: string; status: string; matchday?: number | null; round_name?: string | null; fixture_code?: string };

async function api(url: string, method = "GET", body?: unknown) {
  const response = await fetch(url, { method, credentials: "include", cache: "no-store", headers: body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The request could not be completed.");
  return data;
}

export default function AdminPanel() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [competitionId, setCompetitionId] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [competitionName, setCompetitionName] = useState("");
  const [season, setSeason] = useState("");
  const [format, setFormat] = useState("table_elimination");
  const [newTeams, setNewTeams] = useState("");
  const [removeTeams, setRemoveTeams] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [stage, setStage] = useState("group");
  const [matchday, setMatchday] = useState("1");
  const [groupName, setGroupName] = useState("A");
  const [roundName, setRoundName] = useState("Round of 12");
  const [fixtureId, setFixtureId] = useState("");
  const [postponeDate, setPostponeDate] = useState("");
  const [postponeReason, setPostponeReason] = useState("");

  const loadCompetitions = useCallback(async () => {
    const data = await api("/api/competitions");
    setCompetitions(data.competitions || []);
    if (competitionId && !(data.competitions || []).some((c: Competition) => c.id === competitionId)) setCompetitionId("");
  }, [competitionId]);

  const loadSelected = useCallback(async () => {
    if (!competitionId) { setTeams([]); setFixtures([]); return; }
    const [teamData, fixtureData] = await Promise.all([
      api(`/api/admin/competition-teams?competition_id=${encodeURIComponent(competitionId)}`),
      api(`/api/fixtures?competition=${encodeURIComponent(competitionId)}`),
    ]);
    setTeams(teamData.teams || []);
    setFixtures(fixtureData.fixtures || []);
  }, [competitionId]);

  useEffect(() => { loadCompetitions().catch(e => setMessage(e.message)); }, [loadCompetitions]);
  useEffect(() => { loadSelected().catch(e => setMessage(e.message)); }, [loadSelected]);

  const selectedFixture = useMemo(() => fixtures.find(f => f.id === fixtureId), [fixtures, fixtureId]);
  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true); setMessage("");
    try { await action(); setMessage(success); await loadCompetitions(); await loadSelected(); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Unexpected error."); }
    finally { setBusy(false); }
  };

  const createCompetition = () => run(async () => {
    if (!competitionName.trim()) throw new Error("Enter a competition name.");
    await api("/api/admin/competitions", "POST", { name: competitionName.trim(), season: season.trim() || null, format, status: "draft" });
    setCompetitionName(""); setSeason("");
  }, "Competition created.");

  const deleteCompetition = () => run(async () => {
    if (!competitionId) throw new Error("Select a competition first.");
    const item = competitions.find(c => c.id === competitionId);
    if (!window.confirm(`Delete “${item?.name || "this competition"}” and all its fixtures and results? This cannot be undone.`)) return;
    await api(`/api/admin/competitions?id=${encodeURIComponent(competitionId)}`, "DELETE");
    setCompetitionId("");
  }, "Competition deleted.");

  const addTeams = () => run(async () => {
    const names = newTeams.split(/[\n,;]+/).map(v => v.trim()).filter(Boolean);
    if (!names.length) throw new Error("Enter at least one team name.");
    const data = await api("/api/admin/competition-teams/bulk", "POST", { competition_id: competitionId, team_names: names });
    setNewTeams(""); setMessage(`Added ${data.added} team(s); ${data.skipped} already existed.`);
  }, "Teams updated.");

  const removeSelectedTeams = () => run(async () => {
    const names = removeTeams.split(/[\n,;]+/).map(v => v.trim()).filter(Boolean);
    if (!names.length) throw new Error("Enter the team names to remove.");
    if (!window.confirm(`Remove ${names.length} team(s) from this competition?`)) return;
    const data = await api("/api/admin/competition-teams/bulk", "DELETE", { competition_id: competitionId, team_names: names });
    setRemoveTeams(""); setMessage(`Removed ${data.removed}; not found ${data.not_found}.`);
  }, "Teams updated.");

  const generateFixtures = (replace: boolean) => run(async () => {
    if (!competitionId) throw new Error("Select a competition first.");
    if (replace && !window.confirm("Replace all fixtures? This is only allowed before matches start.")) return;
    const data = await api("/api/admin/fixtures/generate", "POST", { competition_id: competitionId, replace });
    setMessage(`Created ${data.created} fixture(s) across ${data.matchdays} round(s).`);
  }, "Fixtures generated.");

  const createFixture = () => run(async () => {
    if (!homeTeam || !awayTeam) throw new Error("Choose both teams.");
    await api("/api/admin/fixtures/create", "POST", { competition_id: competitionId, home_team_id: homeTeam, away_team_id: awayTeam, stage, matchday: stage === "knockout" ? null : matchday, group_name: stage === "group" ? groupName : null, round_name: roundName });
    setHomeTeam(""); setAwayTeam("");
  }, "Fixture created.");

  const postponeFixture = () => run(async () => {
    if (!fixtureId) throw new Error("Select a fixture.");
    const body: Record<string, string> = { fixture_id: fixtureId, reason: postponeReason };
    if (postponeDate) body.scheduled_at = new Date(postponeDate).toISOString().replace("Z", "+00:00");
    await api("/api/admin/fixtures/postpone", "POST", body);
    setFixtureId(""); setPostponeDate(""); setPostponeReason("");
  }, postponeDate ? "Fixture rescheduled." : "Fixture postponed.");

  const deleteFixture = () => run(async () => {
    if (!fixtureId) throw new Error("Select a fixture.");
    if (!window.confirm("Delete this fixture and its recorded events?")) return;
    await api(`/api/admin/fixtures/remove?id=${encodeURIComponent(fixtureId)}`, "DELETE");
    setFixtureId("");
  }, "Fixture deleted.");

  return <main className="container">
    <PageHeading eyebrow="VMF MANAGEMENT" title="Admin Panel." description="Create and manage competitions, teams and fixtures. All actions are protected by your Discord admin session." />
    <div className="panel-tabs"><Link href="/admin">Match Results</Link><span className="active">Admin Panel</span><Link href="/fixtures">Fixtures</Link></div>

    <section className="content-section">
      <div className="panel-grid">
        <section className="feature-card">
          <p className="eyebrow">01 · COMPETITIONS</p><h2>Create competition</h2>
          <label className="admin-label">Competition name</label><input className="admin-input" value={competitionName} onChange={e => setCompetitionName(e.target.value)} placeholder="VMF Champions Cup" />
          <label className="admin-label">Season</label><input className="admin-input" value={season} onChange={e => setSeason(e.target.value)} placeholder="Season 2" />
          <label className="admin-label">Format</label><select className="admin-input" value={format} onChange={e => setFormat(e.target.value)}><option value="table_elimination">Groups + elimination (12/16 teams)</option><option value="league">League</option><option value="elimination">Knockout</option><option value="champions">UEFA league format</option></select>
          <button className="admin-submit" disabled={busy} onClick={createCompetition}>Create competition</button>
        </section>

        <section className="feature-card">
          <p className="eyebrow">02 · SELECT COMPETITION</p><h2>Manage competition</h2>
          <label className="admin-label">Competition</label><select className="admin-input" value={competitionId} onChange={e => { setCompetitionId(e.target.value); setFixtureId(""); }}><option value="">Select a competition</option>{competitions.map(c => <option key={c.id} value={c.id}>{c.name}{c.season ? ` · ${c.season}` : ""}</option>)}</select>
          <p className="panel-note">{teams.length} teams · {fixtures.length} fixtures</p>
          <button className="danger-button" disabled={busy || !competitionId} onClick={deleteCompetition}>Delete competition and its data</button>
        </section>

        <section className="feature-card">
          <p className="eyebrow">03 · TEAMS</p><h2>Add teams</h2>
          <p className="panel-note">One team per line, or separate names with commas.</p>
          <textarea className="admin-input panel-textarea" value={newTeams} onChange={e => setNewTeams(e.target.value)} placeholder={'Team One\nTeam Two\nTeam Three'} disabled={!competitionId} />
          <button className="admin-submit" disabled={busy || !competitionId} onClick={addTeams}>Add teams</button>
          <label className="admin-label">Remove teams by name</label><textarea className="admin-input panel-textarea" value={removeTeams} onChange={e => setRemoveTeams(e.target.value)} placeholder={'Team One\nTeam Two'} disabled={!competitionId} />
          <button className="danger-button" disabled={busy || !competitionId} onClick={removeSelectedTeams}>Remove teams</button>
          <div className="team-chips">{teams.map(t => <span key={t.id}>{t.name}{t.group_name ? ` · ${t.group_name}` : ""}</span>)}</div>
        </section>

        <section className="feature-card">
          <p className="eyebrow">04 · FIXTURE GENERATOR</p><h2>Create fixture list</h2>
          <p className="panel-note">Automatically generate the full schedule from registered teams and the competition format.</p>
          <button className="admin-submit" disabled={busy || !competitionId} onClick={() => generateFixtures(false)}>Generate fixtures</button>
          <button className="danger-button" disabled={busy || !competitionId} onClick={() => generateFixtures(true)}>Replace existing fixtures</button>
        </section>

        <section className="feature-card">
          <p className="eyebrow">05 · MANUAL FIXTURE</p><h2>Create one fixture</h2>
          <label className="admin-label">Home team</label><select className="admin-input" value={homeTeam} onChange={e => setHomeTeam(e.target.value)} disabled={!competitionId}><option value="">Select home team</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          <label className="admin-label">Away team</label><select className="admin-input" value={awayTeam} onChange={e => setAwayTeam(e.target.value)} disabled={!competitionId}><option value="">Select away team</option>{teams.filter(t => t.id !== homeTeam).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          <label className="admin-label">Stage</label><select className="admin-input" value={stage} onChange={e => setStage(e.target.value)}><option value="group">Group</option><option value="league">League</option><option value="knockout">Knockout</option></select>
          {stage === "group" && <><label className="admin-label">Group</label><select className="admin-input" value={groupName} onChange={e => setGroupName(e.target.value)}>{["A","B","C","D"].map(g => <option key={g} value={g}>Group {g}</option>)}</select></>}
          {stage !== "knockout" && <><label className="admin-label">Matchday</label><input className="admin-input" type="number" min="1" value={matchday} onChange={e => setMatchday(e.target.value)} /></>}
          {stage === "knockout" && <><label className="admin-label">Round name</label><input className="admin-input" value={roundName} onChange={e => setRoundName(e.target.value)} /></>}
          <button className="admin-submit" disabled={busy || !competitionId || teams.length < 2} onClick={createFixture}>Create fixture</button>
        </section>

        <section className="feature-card">
          <p className="eyebrow">06 · FIXTURE ACTIONS</p><h2>Postpone, reschedule or delete</h2>
          <label className="admin-label">Select fixture</label><select className="admin-input" value={fixtureId} onChange={e => setFixtureId(e.target.value)} disabled={!competitionId}><option value="">Choose a fixture</option>{fixtures.map(f => <option key={f.id} value={f.id}>{f.home_name} vs {f.away_name}{f.matchday ? ` · MD ${f.matchday}` : f.round_name ? ` · ${f.round_name}` : ""} · {f.status}</option>)}</select>
          {selectedFixture && <p className="panel-note">Selected: {selectedFixture.home_name} vs {selectedFixture.away_name} · {selectedFixture.status}</p>}
          <label className="admin-label">New date and time (optional)</label><input className="admin-input" type="datetime-local" value={postponeDate} onChange={e => setPostponeDate(e.target.value)} />
          <label className="admin-label">Reason (optional)</label><input className="admin-input" value={postponeReason} onChange={e => setPostponeReason(e.target.value)} placeholder="Reason for postponement" />
          <button className="admin-submit" disabled={busy || !fixtureId} onClick={postponeFixture}>{postponeDate ? "Reschedule fixture" : "Postpone fixture"}</button>
          <button className="danger-button" disabled={busy || !fixtureId} onClick={deleteFixture}>Delete fixture</button>
          <p className="panel-note">Matches that have started or been confirmed cannot be postponed or rescheduled.</p>
        </section>
      </div>
      {message && <p className="panel-message" role="status">{message}</p>}
      <div className="notice" style={{ marginTop: 22 }}>Important: deleting a competition removes its fixtures, results and registered teams from that competition. Deleting a team from a competition is blocked after a match has started.</div>
    </section>
    <style jsx>{`
      .panel-tabs{display:flex;gap:8px;align-items:center;margin:0 0 30px;border-bottom:1px solid var(--border);padding-bottom:12px;flex-wrap:wrap}
      .panel-tabs a,.panel-tabs span{padding:10px 15px;border-radius:9px;text-decoration:none;color:var(--muted);font-size:13px;font-weight:800}
      .panel-tabs .active{background:var(--foreground);color:var(--background)}
      .panel-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;align-items:start}
      .feature-card h2{font-size:21px;margin:8px 0 16px}
      .admin-label{display:block;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin:16px 0 7px;color:var(--foreground)}
      .admin-input{width:100%;min-height:44px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--foreground);font:inherit}
      .panel-textarea{min-height:100px;resize:vertical}
      .admin-submit,.danger-button{width:100%;min-height:44px;border:0;border-radius:10px;padding:10px 14px;margin-top:12px;background:var(--foreground);color:var(--background);font-weight:800;cursor:pointer}
      .danger-button{background:#a83232;color:#fff}
      button:disabled{opacity:.45;cursor:not-allowed}
      .panel-note{font-size:12px;color:var(--muted);line-height:1.6;margin:10px 0}
      .team-chips{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px}
      .team-chips span{font-size:11px;padding:6px 9px;border:1px solid var(--border);border-radius:99px;color:var(--muted)}
      .panel-message{padding:14px 16px;margin-top:20px;border:1px solid var(--border);border-radius:10px;font-weight:700}
      @media(max-width:760px){.panel-grid{grid-template-columns:1fr}}
    `}</style>
  </main>;
}
