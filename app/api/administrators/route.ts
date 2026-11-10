
import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";

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

type DiscordUser = {
  id: string;
  bot?: boolean;
};

type DiscordMember = {
  user: DiscordUser;
  roles: string[];
};

type VerifiedUser = {
  discord_id: string;
  roblox_id: string;
  roblox_username: string;
};

type RobloxUser = {
  id: number;
  name: string;
  displayName: string;
};

type RobloxThumbnail = {
  targetId: number;
  imageUrl: string;
};

export async function GET() {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "DISCORD_BOT_TOKEN is not configured." },
      { status: 500 }
    );
  }

  try {
    // 1. Get all Discord members
    const allMembers: DiscordMember[] = [];
    let after = "0";

    while (true) {
      const url = new URL(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members`
      );

      url.searchParams.set("limit", "1000");
      url.searchParams.set("after", after);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bot ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        console.error("Discord API error:", response.status);

        return NextResponse.json(
          { error: "Discord API request failed." },
          { status: 502 }
        );
      }

      const members: DiscordMember[] = await response.json();

      if (!Array.isArray(members)) {
        throw new Error("Invalid Discord members response.");
      }

      allMembers.push(...members);

      if (members.length < 1000) break;

      after = members[members.length - 1].user.id;
    }

    // 2. Get all verified accounts from Neon
    const verifiedRows = await sql`
      SELECT discord_id, roblox_id, roblox_username
      FROM verified_users
    ` as VerifiedUser[];

    const verifiedMap = new Map<string, VerifiedUser>();

    for (const row of verifiedRows) {
      verifiedMap.set(String(row.discord_id), {
        discord_id: String(row.discord_id),
        roblox_id: String(row.roblox_id),
        roblox_username: row.roblox_username,
      });
    }

    // 3. Find members with a VMF role AND a Roblox verification
    const eligibleMembers = allMembers
      .filter((member) => member.user && !member.user.bot)
      .map((member) => {
        const groupIndex = ROLE_GROUPS.findIndex((group) =>
          member.roles.includes(group.roleId)
        );

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
  } catch (error) {
    console.error("VMF administrators API error:", error);

    return NextResponse.json(
      {
        error: "An unexpected error occurred while loading the directory.",
      },
      { status: 500 }
    );
  }
}
