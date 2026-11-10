import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { PageHeading } from "@/components/SiteShell";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  // Roblox public profile information
  try {
    const [userResponse, avatarResponse] = await Promise.all([
      fetch(`https://users.roblox.com/v1/users/${robloxId}`, {
        next: { revalidate: 3600 },
      }),
      fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=420x420&format=Png&isCircular=false`,
        { next: { revalidate: 3600 } }
      ),
    ]);

    if (userResponse.ok) {
      const user: RobloxUser = await userResponse.json();
      displayName = user.displayName || displayName;
    }

    if (avatarResponse.ok) {
      const image: RobloxThumbnail = await avatarResponse.json();
      avatar = image.data?.[0]?.imageUrl || "";
    }
  } catch (error) {
    console.error("Roblox profile fetch error:", error);
  }

  // Resolve the member's highest VMF role from Discord
  const discordToken = process.env.DISCORD_BOT_TOKEN;
  if (discordToken) {
    try {
      const response = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${player.discord_id}`,
        {
          headers: { Authorization: `Bot ${discordToken}` },
          cache: "no-store",
        }
      );

      if (response.ok) {
        const member: DiscordMember = await response.json();
        const role = ROLE_GROUPS.find((item) =>
          (member.roles || []).includes(item.roleId)
        );
        if (role) roleName = role.name;
      }
    } catch (error) {
      console.error("Discord role lookup error:", error);
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
            <div className="player-avatar avatar-placeholder">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="player-information">
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


    </main>
  );
}
