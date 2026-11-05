
import { NextResponse } from "next/server";

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
  { name: "OFFICIAL TEAM", roleId: "1457406868124209310" },
  { name: "COMMUNITY", roleId: "1457406868078202953" },
];

type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  discriminator?: string;
  avatar?: string | null;
  bot?: boolean;
};

type DiscordMember = {
  user: DiscordUser;
  nick?: string | null;
  roles: string[];
};

function getAvatar(user: DiscordUser) {
  if (user.avatar) {
    const extension = user.avatar.startsWith("a_") ? "gif" : "png";

    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=128`;
  }

  const defaultAvatar = Number(user.discriminator || 0) % 6;

  return `https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png`;
}

export async function GET() {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "DISCORD_BOT_TOKEN is not configured in Vercel." },
      { status: 500 }
    );
  }

  try {
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
        const details = await response.text();

        console.error("Discord API error:", response.status, details);

        return NextResponse.json(
          {
            error: "Discord API request failed.",
            discordStatus: response.status,
          },
          { status: 502 }
        );
      }

      const members: DiscordMember[] = await response.json();

      if (!Array.isArray(members)) {
        throw new Error("Discord returned an invalid members response.");
      }

      allMembers.push(...members);

      if (members.length < 1000) {
        break;
      }

      after = members[members.length - 1].user.id;
    }

    const groups = ROLE_GROUPS.map((group) => ({
      ...group,
      members: [] as {
        id: string;
        username: string;
        displayName: string;
        avatar: string;
      }[],
    }));

    for (const member of allMembers) {
      const user = member.user;

      if (!user || user.bot) continue;

      // A member is displayed only under their highest VMF role.
      const groupIndex = ROLE_GROUPS.findIndex((group) =>
        member.roles.includes(group.roleId)
      );

      if (groupIndex === -1) continue;

      groups[groupIndex].members.push({
        id: user.id,
        username: user.username,
        displayName:
          member.nick || user.global_name || user.username,
        avatar: getAvatar(user),
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
      { error: "An unexpected error occurred while loading Discord members." },
      { status: 500 }
    );
  }
}
