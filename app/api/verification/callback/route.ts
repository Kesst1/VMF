
import { NextRequest, NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

export const runtime = "nodejs";

function result(message: string, status = 200) {
  return new NextResponse(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");

    if (!state || state.length > 256) {
      return result("Invalid or missing verification state.", 400);
    }

    // Consume the OAuth state exactly once
    const states = await sql`
      DELETE FROM oauth_states
      WHERE state = ${state}
        AND created_at > NOW() - INTERVAL '15 minutes'
      RETURNING discord_id, code_verifier
    `;

    if (states.length === 0) {
      return result(
        "Verification session expired or invalid. Please try again.",
        400
      );
    }

    const discordId = String(states[0].discord_id);
    const codeVerifier = states[0].code_verifier;

    if (oauthError || !code) {
      return result(
        "Roblox authorization was cancelled. You can try again."
      );
    }

    const clientId = process.env.ROBLOX_CLIENT_ID;
    const clientSecret = process.env.ROBLOX_CLIENT_SECRET;
    const redirectUri = process.env.ROBLOX_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("Missing Roblox OAuth environment variables.");
      return result("Server OAuth configuration error.", 500);
    }

    // Exchange authorization code for access token
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
      code_verifier: codeVerifier,
    });

    const tokenResponse = await fetch(
      "https://apis.roblox.com/oauth/v1/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: tokenBody.toString(),
        cache: "no-store",
      }
    );

    if (!tokenResponse.ok) {
      console.error(
        "Roblox token exchange failed:",
        tokenResponse.status
      );
      return result(
        "Could not complete Roblox authentication. Please try again.",
        502
      );
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return result("Roblox did not return an access token.", 502);
    }

    // Retrieve authenticated Roblox identity
    const userResponse = await fetch(
      "https://apis.roblox.com/oauth/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        cache: "no-store",
      }
    );

    if (!userResponse.ok) {
      console.error(
        "Roblox userinfo failed:",
        userResponse.status
      );
      return result("Could not retrieve Roblox account information.", 502);
    }

    const userData = await userResponse.json();

    const robloxId = userData.sub;
    const robloxUsername =
      userData.preferred_username ||
      userData.name ||
      "Unknown";

    if (
      typeof robloxId !== "string" ||
      !/^\d{1,20}$/.test(robloxId)
    ) {
      return result("Invalid Roblox account information.", 400);
    }

    // Save the verified account.
    // Both Discord ID and Roblox ID must be unique.
    const inserted = await sql`
      INSERT INTO verified_users (
        discord_id,
        roblox_id,
        roblox_username
      )
      VALUES (
        ${discordId},
        ${robloxId},
        ${robloxUsername}
      )
      ON CONFLICT DO NOTHING
      RETURNING discord_id
    `;

    if (inserted.length === 0) {
      const existingDiscord = await sql`
        SELECT roblox_id
        FROM verified_users
        WHERE discord_id = ${discordId}
        LIMIT 1
      `;

      if (existingDiscord.length > 0) {
        if (String(existingDiscord[0].roblox_id) === robloxId) {
          return result(
            "This Discord account is already linked to this Roblox account."
          );
        }

        return result(
          "This Discord account is already linked to another Roblox account.",
          409
        );
      }

      return result(
        "This Roblox account is already linked to another Discord account.",
        409
      );
    }

    console.log(
      `VMF verification successful: Discord ${discordId}, Roblox ${robloxId}`
    );

    return result(
      `Verification successful!\n\nRoblox username: ${robloxUsername}\nRoblox ID: ${robloxId}\n\nYou can now return to Discord.`
    );

  } catch (error) {
    console.error("Roblox callback error:", error);
    return result("An internal verification error occurred.", 500);
  }
}
