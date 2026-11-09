
import { NextRequest, NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

function result(
  message: string,
  status = 200,
  details?: {
    username?: string;
    robloxId?: string;
  }
) {
  const success = status >= 200 && status < 300;

  const username = escapeHtml(details?.username || "");
  const robloxId = escapeHtml(details?.robloxId || "");
  const safeMessage = escapeHtml(message);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">

  <title>${success ? "Verification Successful" : "Verification Failed"} | VMF</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: #f5f5f5;
      color: #111;
      font-family: Arial, Helvetica, sans-serif;
    }

    .card {
      width: 100%;
      max-width: 460px;
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 18px;
      padding: 38px 30px;
      text-align: center;
      box-shadow: 0 18px 55px rgba(0,0,0,.06);
    }

    .logo {
      width: 100px;
      height: 100px;
      object-fit: contain;
      display: block;
      margin: 0 auto 25px;
    }

    .icon {
      width: 68px;
      height: 68px;
      display: grid;
      place-items: center;
      margin: 0 auto 22px;
      border-radius: 50%;
      background: ${success ? "#e9f8ef" : "#fff0f0"};
      color: ${success ? "#168344" : "#c63838"};
      font-size: 34px;
      font-weight: bold;
    }

    h1 {
      font-size: 25px;
      margin: 0 0 12px;
      letter-spacing: -.7px;
    }

    .description {
      color: #777;
      font-size: 14px;
      line-height: 1.7;
      margin: 0 0 26px;
    }

    .profile {
      padding: 18px;
      margin: 24px 0;
      border: 1px solid #e9e9e9;
      border-radius: 12px;
      background: #fafafa;
      text-align: left;
    }

    .profile-label {
      color: #888;
      font-size: 10px;
      font-weight: bold;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    .profile-value {
      font-size: 15px;
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    .profile-row + .profile-row {
      margin-top: 17px;
    }

    .button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 49px;
      margin-top: 11px;
      border-radius: 9px;
      text-decoration: none;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1px;
      transition: .2s ease;
    }

    .button-primary {
      background: #111;
      color: #fff;
    }

    .button-primary:hover {
      background: #333;
    }

    .button-secondary {
      background: #fff;
      color: #111;
      border: 1px solid #dedede;
    }

    .button-secondary:hover {
      background: #f5f5f5;
    }

    .footer {
      color: #aaa;
      font-size: 10px;
      letter-spacing: 1.5px;
      margin-top: 30px;
    }

    @media (max-width: 420px) {
      .card {
        padding: 30px 20px;
      }

      h1 {
        font-size: 22px;
      }
    }
  </style>
</head>

<body>
  <main class="card">

    <img
  src="https://i.ibb.co/nsFrT7D3/VMF-removebg-preview.png"
  alt="VMF"
  style="width:100px;height:100px;object-fit:contain;margin-bottom:25px;"
    />

    <div class="icon">${success ? "✓" : "!"}</div>

    <h1>
      ${success ? "Verification Successful" : "Verification Failed"}
    </h1>

    <p class="description">${safeMessage}</p>

    ${success && username && robloxId ? `
      <section class="profile">

        <div class="profile-row">
          <div class="profile-label">Roblox Username</div>
          <div class="profile-value">${username}</div>
        </div>

        <div class="profile-row">
          <div class="profile-label">Roblox ID</div>
          <div class="profile-value">${robloxId}</div>
        </div>

        <div class="profile-row">
          <div class="profile-label">Verification Status</div>
          <div class="profile-value">✓ Verified</div>
        </div>

      </section>
    ` : ""}

    <a class="button button-primary" href="/">
      GO TO WEBSITE →
    </a>

    <a
      class="button button-secondary"
      href="https://discord.com/channels/@me"
    >
      RETURN TO DISCORD
    </a>

    <div class="footer">
      VMF · VIRTUAL MODIFIED FOOTBALL
    </div>

  </main>
</body>
</html>`;

  return new NextResponse(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
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
      return result(
        "The verification session is invalid. Please start again.",
        400
      );
    }

    // Consume OAuth state exactly once
    const states = await sql`
      DELETE FROM oauth_states
      WHERE state = ${state}
        AND created_at > NOW() - INTERVAL '15 minutes'
      RETURNING discord_id, code_verifier
    `;

    if (states.length === 0) {
      return result(
        "Your verification session expired or is invalid. Please try again.",
        400
      );
    }

    const discordId = String(states[0].discord_id);
    const codeVerifier = states[0].code_verifier;

    if (oauthError || !code) {
      return result(
        "Roblox authorization was cancelled. You can try again.",
        400
      );
    }

    const clientId = process.env.ROBLOX_CLIENT_ID;
    const clientSecret = process.env.ROBLOX_CLIENT_SECRET;
    const redirectUri = process.env.ROBLOX_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("Missing Roblox OAuth environment variables.");

      return result(
        "The server OAuth configuration is incomplete.",
        500
      );
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
        "Roblox authentication could not be completed. Please try again.",
        502
      );
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return result(
        "Roblox did not return an access token.",
        502
      );
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

      return result(
        "Could not retrieve your Roblox account information.",
        502
      );
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
      return result(
        "Roblox returned invalid account information.",
        400
      );
    }

    // Insert only if both account IDs are not already linked
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
            "This Discord account is already linked to this Roblox account.",
            200,
            {
              username: robloxUsername,
              robloxId,
            }
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
      "Your Roblox account has been successfully linked to VMF. You can now return to Discord.",
      200,
      {
        username: robloxUsername,
        robloxId,
      }
    );

  } catch (error) {
    console.error("Roblox callback error:", error);

    return result(
      "An internal verification error occurred. Please try again.",
      500
    );
  }
}
