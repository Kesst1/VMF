"use client";
import { useEffect, useMemo, useState } from "react";

type Competition = { id: string; name: string; season?: string | null };
type Player = { roblox_id: string; player_name: string; competition_id: string };
export default function AdminResetStats() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [competitionId, setCompetitionId] = useState("");
  const [robloxId, setRobloxId] = useState("");
  const [eventType, setEventType] = useState("goal");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { fetch("/api/admin/reset-stats", { credentials: "include", cache: "no-store" }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Could not load reset options."); setCompetitions(d.competitions || []); setPlayers(d.players || []); }).catch(e => setMessage(e.message)); }, []);
  const availablePlayers = useMemo(() => players.filter(p => p.competition_id === competitionId), [players, competitionId]);
  async function reset() {
    if (!competitionId || !robloxId) return setMessage("Select a competition and player.");
    const comp = competitions.find(c => c.id === competitionId);
    const player = availablePlayers.find(p => p.roblox_id === robloxId);
    const label = eventType === "both" ? "goals and assists" : eventType === "goal" ? "goals" : "assists";
    if (!window.confirm(`Reset ${label} for ${player?.player_name || robloxId} in ${comp?.name || "this competition"}? This cannot be undone.`)) return;
    const confirmation = window.prompt('Type RESET SELECTED STATS to confirm.');
    if (confirmation !== "RESET SELECTED STATS") return;
    setBusy(true); setMessage("");
    try {
      const r = await fetch("/api/admin/reset-stats", { method: "POST", credentials: "include", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ competition_id: competitionId, roblox_id: robloxId, event_type: eventType, confirmation }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Reset failed.");
      setMessage(`${d.reset} ${d.reset === 1 ? "event" : "events"} deleted for ${player?.player_name || robloxId}.`);
      const refresh = await fetch("/api/admin/reset-stats", { credentials: "include", cache: "no-store" }).then(x => x.json()); setPlayers(refresh.players || []);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Unexpected error."); } finally { setBusy(false); }
  }
  return <section className="feature-card">
    <p className="eyebrow">07 · PLAYER STATISTICS</p><h2>Reset selected stats</h2>
    <p className="panel-note">Choose the competition, player and statistic type. Other competitions and the player's other statistic type remain untouched.</p>
    <label className="admin-label">Competition</label><select className="admin-input" value={competitionId} onChange={e => { setCompetitionId(e.target.value); setRobloxId(""); }}><option value="">Select competition</option>{competitions.map(c => <option key={c.id} value={c.id}>{c.name}{c.season ? ` · ${c.season}` : ""}</option>)}</select>
    <label className="admin-label">Player</label><select className="admin-input" value={robloxId} onChange={e => setRobloxId(e.target.value)} disabled={!competitionId}><option value="">Select player</option>{availablePlayers.map(p => <option key={p.roblox_id} value={p.roblox_id}>{p.player_name} · {p.roblox_id}</option>)}</select>
    <label className="admin-label">Statistic to reset</label><select className="admin-input" value={eventType} onChange={e => setEventType(e.target.value)}><option value="goal">Goals only</option><option value="assist">Assists only</option><option value="both">Goals and assists</option></select>
    <button className="danger-button" disabled={busy || !competitionId || !robloxId} onClick={reset}>{busy ? "Resetting…" : "Reset selected statistics"}</button>
    {message && <p className="panel-note" role="status">{message}</p>}
  </section>;
}
