
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

<<<<<<< HEAD
        if (groupIndex === -1) return null;

        const verified = verifiedMap.get(member.user.id);

        if (!verified) return null;

        return {
          discordId: member.user.id,
          groupIndex,
          robloxId: verified.roblox_id,
          robloxUsername: verified.roblox_username,
        };
      })
      .filter((member): member is NonNullable<typeof member> =>
        member !== null
      );

    // 4. Get Roblox display names and avatars in batches
    const robloxDetails = new Map<
      string,
      { displayName: string; avatar: string }
    >();

    const robloxIds = [
      ...new Set(eligibleMembers.map((member) => member.robloxId)),
    ];

    for (let i = 0; i < robloxIds.length; i += 100) {
      const batch = robloxIds.slice(i, i + 100);
      const numericIds = batch.map(Number);

      const [usersResponse, thumbnailsResponse] = await Promise.all([
        fetch("https://users.roblox.com/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: numericIds }),
          cache: "no-store",
        }),

        fetch(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${batch.join(",")}&size=150x150&format=Png&isCircular=false`,
          { cache: "no-store" }
        ),
      ]);

      const users: RobloxUser[] = usersResponse.ok
        ? (await usersResponse.json()).data || []
        : [];

      const thumbnails: RobloxThumbnail[] = thumbnailsResponse.ok
        ? (await thumbnailsResponse.json()).data || []
        : [];

      const thumbnailMap = new Map(
        thumbnails.map((item) => [
          String(item.targetId),
          item.imageUrl,
        ])
      );

      for (const user of users) {
        const id = String(user.id);

        robloxDetails.set(id, {
          displayName: user.displayName || user.name,
          avatar: thumbnailMap.get(id) || "",
        });
      }
    }

    // 5. Build the directory using Roblox information
    const groups = ROLE_GROUPS.map((group) => ({
      ...group,
      members: [] as {
        id: string;
        robloxId: string;
        username: string;
        displayName: string;
        avatar: string;
      }[],
    }));

    for (const member of eligibleMembers) {
      const roblox = robloxDetails.get(member.robloxId);

      groups[member.groupIndex].members.push({
        // Keep Discord ID for the existing profile page URL
        id: member.discordId,
        robloxId: member.robloxId,

        // Roblox username
        username: member.robloxUsername,

        // Roblox display name
        displayName:
          roblox?.displayName || member.robloxUsername,

        // Roblox avatar
        avatar: roblox?.avatar || "",
      });
    }

    return NextResponse.json(
      {
        groups,
        totalMembers: groups.reduce(
          (total, group) => total + group.members.length,
          0
        ),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
=======
    stats = statsResult[0] || stats;
>>>>>>> 68c3685fc6ac8f3773674374c8f4213c38eb574c
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
