import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { checkDiscordAdmin, createAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";

function redirectToAdmin(request: NextRequest, status: string) {
  const url = new URL("/admin", request.url);
  url.searchParams.set("auth", status);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state") || "";
  const code = request.nextUrl.searchParams.get("code");
  const stateCookie = request.cookies.get("vmf_admin_oauth_state")?.value || "";
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  const response = redirectToAdmin(request, "error");
  response.cookies.set("vmf_admin_oauth_state", "", {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/api/admin/auth/callback",
    maxAge: 0,
  });

  if (!state || !stateCookie || !code || !clientId || !clientSecret || !redirectUri || !botToken) {
    return response;
  }

  const expected = Buffer.from(stateCookie);
  const supplied = Buffer.from(state);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return response;
  }

  try {
    const tokenResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      console.error("Discord OAuth token exchange failed:", tokenResponse.status);
      return response;
    }

    const tokenData = (await tokenResponse.json()) as { access_token?: string; token_type?: string };
    if (!tokenData.access_token) return response;

    const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      cache: "no-store",
    });
    if (!userResponse.ok) return response;

    const user = (await userResponse.json()) as { id?: string; username?: string };
    if (!user.id || !(await checkDiscordAdmin(user.id))) {
      const denied = redirectToAdmin(request, "denied");
      denied.cookies.set("vmf_admin_oauth_state", "", { path: "/api/admin/auth/callback", maxAge: 0 });
      return denied;
    }

    const session = createAdminSession(user.id);
    const success = NextResponse.redirect(new URL("/admin?auth=success", request.url));
    success.cookies.set("vmf_admin_oauth_state", "", {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/api/admin/auth/callback",
      maxAge: 0,
    });
    success.cookies.set("vmf_admin_session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60,
    });
    success.headers.set("Cache-Control", "no-store");
    return success;
  } catch (error) {
    console.error("Discord admin OAuth callback failed:", error);
    return response;
  }
}
