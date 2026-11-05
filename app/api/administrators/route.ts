
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GUILD_ID = "1457406867960762583";

const ROLE_GROUPS = [
  { name: "COMMISSIONER", roleId: "1457406868136788202", description: "The highest authority of VMF.", icon: "♛" },
  { name: "DEPUTY COMMISSIONER", roleId: "1457406868136788201", description: "Supporting VMF leadership.", icon: "♛" },
  { name: "MAIN DEVELOPER", roleId: "1457406868136788196", description: "Leading technical development.", icon: "⌘" },
  { name: "DEVELOPER", roleId: "1457406868136788195", description: "Building and maintaining VMF.", icon: "⌘" },
  { name: "CHIEF OF STAFF", roleId: "1457406868124209313", description: "Overseeing staff operations.", icon: "✦" },
  { name: "SENIOR STAFF", roleId: "1457406868136788194", description: "Experienced VMF staff members.", icon: "◆" },
  { name: "STAFF", roleId: "1457406868136788193", description: "Managing the VMF community.", icon: "◆" },
  { name: "MODERATOR", roleId: "1457406868124209312", description: "Maintaining a fair community.", icon: "⬡" },
  { name: "OFFICIAL TEAM", roleId: "1457406868136789310", description: "Official VMF representatives.", icon: "⚽" },
  { name: "COMMUNITY", roleId: "1457406868078202953", description: "Members of the VMF community.", icon: "♟" },
];

export async function GET() {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "Discord bot token is not configured." },
      { status: 500 }
    );
  }

  try {
    const allMembers: any[] = [];
    let after = "0";

    while (true) {
      const response = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000&after=${after}`,
        {
          headers: {
            Authorization: `Bot ${token}`,
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          { error: "Discord API request failed.", status: response.status },
          { status: 502 }
        );
      }

      const members = await response.json();

      if (!Array.isArray(members)) {
        throw new Error("Invalid Discord members response.");
      }

      allMembers.push(...members);

      if (members.length < 1000) break;

      after = members[members.length - 1].user.id;
    }

    const groups = ROLE_GROUPS.map((group) => ({
      ...group,
      members: [] as {
        id: string;
        name: string;
        username: string;
        avatar: string;
      }[],
    }));

    for (const member of allMembers) {
      const user = member.user;

      if (!user || user.bot) continue;

      // Only show the member in their highest-ranking VMF role.
      const group = groups.find((item) =>
        member.roles.includes(item.roleId)
      );

      if (!group) continue;

      const avatar = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
        : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`;

      group.members.push({
        id: user.id,
        name: member.nick || user.global_name || user.username,
        username: user.username,
        avatar,
      });
    }

    return NextResponse.json(
      { groups, totalMembers: groups.reduce((sum, group) => sum + group.members.length, 0) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("VMF Discord API error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve VMF Discord members." },
      { status: 500 }
    );
  }
}
