
import { NextRequest, NextResponse } from "next/server";
import {
  randomBytes,
  createHash,
  timingSafeEqual,
} from "node:crypto";
import { sql } from "../../../../lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const expectedKey = process.env.ADMIN_API_KEY;
    const suppliedKey = request.headers.get("x-admin-key") || "";

    if (!expectedKey || !suppliedKey) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const expected = Buffer.from(expectedKey);
    const supplied = Buffer.from(suppliedKey);

    if (
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate Discord ID
    const body = await request.json();
    const discordId = body.discord_id;

    if (
      typeof discordId !== "string" ||
      !/^\d{17,20}$/.test(discordId)
    ) {
      return NextResponse.json(
        { error: "Invalid Discord ID" },
        { status: 400 }
      );
    }

    // Required environment variables
    const clientId = process.env.ROBLOX_CLIENT_ID;
    const redirectUri = process.env.ROBLOX_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: "OAuth configuration missing" },
        { status: 500 }
      );
    }

    // Generate secure OAuth state and PKCE verifier
    const state = randomBytes(32).toString("base64url");
    const verifier = randomBytes(48).toString("base64url");

    const challenge = createHash("sha256")
      .update(verifier)
      .digest("base64url");

    // Remove expired requests
    await sql`
      DELETE FROM oauth_states
      WHERE created_at < NOW() - INTERVAL '15 minutes'
    `;

    // Save Discord ID and PKCE verifier
    await sql`
      INSERT INTO oauth_states (
        state,
        discord_id,
        code_verifier
      )
      VALUES (
        ${state},
        ${discordId},
        ${verifier}
      )
    `;

    // Build Roblox authorization URL
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "openid profile",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    const authorizationUrl =
      `https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`;

    return NextResponse.json({
      success: true,
      authorization_url: authorizationUrl,
    });

  } catch (error) {
    console.error("Verification start error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
