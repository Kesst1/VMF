
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { PageHeading } from "@/components/SiteShell";

export const dynamic = "force-dynamic";

export default async function PlayerProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let player: any = null;
  let stats: any = {
    matches: 0,
    goals: 0,
    assists: 0,
  };

  try {
    // Find the Roblox account using the Discord ID from the URL
    const result = await sql`
      SELECT discord_id, roblox_id, roblox_username, created_at
      FROM verified_users
      WHERE discord_id = ${id}
      LIMIT 1
    `;

    player = result[0];

    if (!player) {
      notFound();
    }

    // Statistics must use the Roblox ID, not the Discord ID
    const statsResult = await sql`
      SELECT
        COUNT(DISTINCT f.id)::int AS matches,
        COUNT(*) FILTER (
          WHERE me.event_type = 'goal'
        )::int AS goals,
        COUNT(*) FILTER (
          WHERE me.event_type = 'assist'
        )::int AS assists
      FROM match_events me
      JOIN fixtures f ON f.id = me.fixture_id
      WHERE me.roblox_id = ${String(player.roblox_id)}
        AND f.status = 'confirmed'
    `;

    stats = statsResult[0] || stats;
  } catch (error) {
    console.error("Player profile error:", error);
    throw error;
  }

  return (
    <main className="container">
      <PageHeading
        eyebrow="PLAYER SHEET · VERIFIED"
        title={player.roblox_username}
        description={`Official VMF player profile · Roblox ID ${player.roblox_id}`}
      />

      <section className="content-section">
        <div className="stat-grid">
          <div className="stat-card">
            <strong>{stats.matches}</strong>
            <span>Matches recorded</span>
          </div>

          <div className="stat-card">
            <strong>{stats.goals}</strong>
            <span>Goals</span>
          </div>

          <div className="stat-card">
            <strong>{stats.assists}</strong>
            <span>Assists</span>
          </div>

          <div className="stat-card">
            <strong>✓</strong>
            <span>Verified player</span>
          </div>
        </div>

        <div className="notice">
          Player statistics are calculated from confirmed VMF match events.
          Statistics will remain empty until match events are recorded.
        </div>
      </section>
    </main>
  );
}
