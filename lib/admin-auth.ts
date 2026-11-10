import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "vmf_admin_session";
export const VMF_GUILD_ID = "1457406867960762583";
export const ALLOWED_ADMIN_ROLE_IDS = [
  "1457406868136788202", // Commissioner
  "1457406868136788193", // Staff
] as const;

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAdminSession(discordId: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 8 * 60 * 60;
  const payload = Buffer.from(`${discordId}:${expiresAt}`).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyAdminSession(token?: string | null): string | null {
  if (!token) return null;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return null;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  const expected = Buffer.from(sign(payload, secret));
  const supplied = Buffer.from(signature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return null;
  }

  try {
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const separator = decoded.lastIndexOf(":");
    if (separator < 1) return null;
    const discordId = decoded.slice(0, separator);
    const expiresAt = Number(decoded.slice(separator + 1));
    if (!/^\d{17,20}$/.test(discordId) || !Number.isInteger(expiresAt)) return null;
    if (expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return discordId;
  } catch {
    return null;
  }
}

export async function checkDiscordAdmin(discordId: string): Promise<boolean> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || !/^\d{17,20}$/.test(discordId)) return false;

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${VMF_GUILD_ID}/members/${discordId}`,
      {
        headers: { Authorization: `Bot ${botToken}` },
        cache: "no-store",
      }
    );
    if (!response.ok) return false;
    const member = (await response.json()) as { roles?: string[] };
    return Array.isArray(member.roles) && ALLOWED_ADMIN_ROLE_IDS.some((roleId) => member.roles!.includes(roleId));
  } catch (error) {
    console.error("Discord admin role check failed:", error);
    return false;
  }
}

export async function isAdminSessionAuthorized(token?: string | null): Promise<boolean> {
  const discordId = verifyAdminSession(token);
  return discordId ? checkDiscordAdmin(discordId) : false;
}

function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) {
      try { return decodeURIComponent(part.slice(index + 1).trim()); } catch { return null; }
    }
  }
  return null;
}

export async function requireAdmin(request: Request) {
  const token = readCookie(request, ADMIN_SESSION_COOKIE);
  const discordId = verifyAdminSession(token);

  if (!discordId) {
    return NextResponse.json(
      { error: "Discord authentication required. Sign in with an authorized VMF account." },
      { status: 401 }
    );
  }

  const allowed = await checkDiscordAdmin(discordId);
  if (!allowed) {
    return NextResponse.json(
      { error: "Access denied. You need the Commissioner or Staff role in the VMF Discord server." },
      { status: 403 }
    );
  }

  return null;
}
