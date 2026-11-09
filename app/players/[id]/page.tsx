import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { PageHeading } from "@/components/SiteShell";

export const dynamic = "force-dynamic";

const GUILD_ID = "1457406867960762583";

const ROLE_GROUPS = [
  { name: "COMMISSIONER", roleId: "1457406868136788202" },
  { name: "DEPUTY COMMISSIONER", roleId: "1457406868136788201" },
  { name: "MAIN DEVELOPER", roleId: "1457406868136788196" },
  { name: "DEVELOPER", roleId: "1457406868136788195" },
  { name: "CHIEF OF STAFF", roleId: "1457406868124209313" },
  { name: "SENIOR STAFF", roleId: "1457406868136788194" },
  { name: "STAFF", roleId: "1457406868136788193" },
  { name: "MODERATOR", roleId: "1457406868124209312" },
  { name: "OFFICIAL TEAM", roleId: "1457406868136788190" },
  { name: "COMMUNITY", roleId: "1457406868078202953" },
];

type DiscordMember = { roles?: string[] };
type RobloxUser = { displayName?: string };
type RobloxThumbnail = { data?: { imageUrl?: string }[] };

export default async function PlayerProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await sql`
    SELECT discord_id, roblox_id, roblox_username, created_at
    FROM verified_users
    WHERE discord_id = ${id}
    LIMIT 1
  `;

  const player = result[0];
  if (!player) notFound();

  const robloxId = String(player.roblox_id);

  const statsResult = await sql`
    SELECT
      COUNT(DISTINCT f.id)::int AS matches,
      COUNT(*) FILTER (WHERE me.event_type = 'goal')::int AS goals,
      COUNT(*) FILTER (WHERE me.event_type = 'assist')::int AS assists
    FROM match_events me
    JOIN fixtures f ON f.id = me.fixture_id
    WHERE me.roblox_id = ${robloxId}
      AND f.status = 'confirmed'
  `;

  const stats = statsResult[0] || { matches: 0, goals: 0, assists: 0 };

  let displayName = player.roblox_username;
  let avatar = "";
  let roleName = "VERIFIED PLAYER";

  const robloxResults = await Promise.allSettled([
    fetch(`https://users.roblox.com/v1/users/${encodeURIComponent(robloxId)}`, {
      next: { revalidate: 3600 },
    }),
    fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${encodeURIComponent(robloxId)}&size=420x420&format=Png&isCircular=false`,
      { next: { revalidate: 3600 } }
    ),
  ]);

  if (robloxResults[0].status === "fulfilled" && robloxResults[0].value.ok) {
    const user = (await robloxResults[0].value.json()) as RobloxUser;
    displayName = user.displayName || displayName;
  }

  if (robloxResults[1].status === "fulfilled" && robloxResults[1].value.ok) {
    const thumbnail = (await robloxResults[1].value.json()) as RobloxThumbnail;
    avatar = thumbnail.data?.[0]?.imageUrl || "";
  }

  const discordToken = process.env.DISCORD_BOT_TOKEN;

  if (discordToken) {
    try {
      const response = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${encodeURIComponent(String(player.discord_id))}`,
        {
          headers: { Authorization: `Bot ${discordToken}` },
          cache: "no-store",
        }
      );

      if (response.ok) {
        const member = (await response.json()) as DiscordMember;
        const role = ROLE_GROUPS.find((item) =>
          (member.roles || []).includes(item.roleId)
        );
        if (role) roleName = role.name;
      }
    } catch (error) {
      console.error("Player Discord role lookup error:", error);
    }
  }

  return (
    <main className="container">
      <PageHeading
        eyebrow="PLAYER SHEET · VERIFIED"
        title={displayName}
        description={`Official VMF player profile · @${player.roblox_username}`}
      />

      <section className="content-section">
        <div className="player-profile">
          {avatar ? (
            <img className="player-avatar" src={avatar} alt={displayName} />
          ) : (
            <div className="player-avatar avatar-fallback">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="player-heading">
            <span className="verified-label">✓ {roleName}</span>
            <h2>{displayName}</h2>
            <p>@{player.roblox_username}</p>
          </div>
        </div>

        <div className="player-details">
          <div className="detail-card">
            <span>ROBLOX USERNAME</span>
            <strong>@{player.roblox_username}</strong>
          </div>
          <div className="detail-card">
            <span>ROBLOX ID</span>
            <strong>{robloxId}</strong>
          </div>
          <div className="detail-card">
            <span>DISCORD ID</span>
            <strong>{player.discord_id}</strong>
          </div>
          <div className="detail-card">
            <span>VMF ROLE</span>
            <strong>{roleName}</strong>
          </div>
          <div className="detail-card">
            <span>VERIFICATION DATE</span>
            <strong>
              {player.created_at
                ? new Date(player.created_at).toLocaleDateString("en-GB")
                : "—"}
            </strong>
          </div>
        </div>

        <h2 className="statistics-title">Player Statistics</h2>

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

      <style jsx>{`
        .player-profile {
          display: flex;
          align-items: center;
          gap: 22px;
          padding: 25px;
          margin-bottom: 22px;
          background: #f7f7f7;
          border: 1px solid #ededed;
          border-radius: 5px;
        }
        .player-avatar {
          width: 105px;
          height: 105px;
          flex-shrink: 0;
          object-fit: cover;
          border-radius: 5px;
          background: #e9e9e9;
        }
        .avatar-fallback {
          display: grid;
          place-items: center;
          color: #777;
          font-size: 36px;
          font-weight: 800;
        }
        .player-heading h2 {
          margin: 10px 0 5px;
          font-size: 26px;
          letter-spacing: -1px;
        }
        .player-heading p {
          margin: 0;
          color: #888;
          font-size: 13px;
        }
        .verified-label {
          color: #555;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }
        .player-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 35px;
        }
        .detail-card {
          display: flex;
          flex-direction: column;
          gap: 9px;
          min-width: 0;
          padding: 18px;
          background: #fff;
          border: 1px solid #ededed;
          border-radius: 4px;
        }
        .detail-card span {
          color: #999;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }
        .detail-card strong {
          font-size: 13px;
          overflow-wrap: anywhere;
        }
        .statistics-title {
          margin: 0 0 16px;
          font-size: 19px;
          letter-spacing: -0.5px;
        }
        @media (max-width: 600px) {
          .player-details { grid-template-columns: 1fr; }
          .player-profile { padding: 16px; }
          .player-avatar { width: 75px; height: 75px; }
          .player-heading h2 { font-size: 20px; }
        }
      `}</style>
    </main>
  );
}
