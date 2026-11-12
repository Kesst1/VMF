# VMF Admin — Discord role access

The `/admin` page and browser-based management requests are protected by Discord OAuth2 and a live role check. Management API routes also accept the private `x-admin-api-key` header for trusted server-to-server requests from the VMF Discord bot.

## Allowed roles

- Commissioner: `1457406868136788202`
- Staff: `1457406868136788193`
- Guild: `1457406867960762583`

Only members who currently have one of those two roles can enter the admin workspace through the website. Website API requests are checked against Discord on every request. The bot can call the management endpoints using `ADMIN_API_KEY`; keep this key only in server-side environment variables. Never expose it to browser code.

## Vercel environment variables

Add these in **Vercel → Project → Settings → Environment Variables** for Production (and Preview if you want the same protection there):

| Variable | Value |
|---|---|
| `DISCORD_CLIENT_ID` | Application ID from Discord Developer Portal → OAuth2 → General |
| `DISCORD_CLIENT_SECRET` | OAuth2 Client Secret from the same Discord application. This is NOT the bot token. |
| `DISCORD_REDIRECT_URI` | `https://vmf-drab.vercel.app/api/admin/auth/callback` |
| `DISCORD_BOT_TOKEN` | Existing private bot token; keep it server-side only. |
| `ADMIN_SESSION_SECRET` | A new random secret of at least 32 characters. Generate one with `openssl rand -base64 48`. |

Keep the existing `DATABASE_URL` and Roblox OAuth variables. `ADMIN_API_KEY` must be configured in Vercel and Wispbyte with exactly the same private value. The bot sends it as `x-admin-api-key` to the protected management APIs. The website continues to use the Discord session cookie.

## Discord Developer Portal

1. Open the Discord application used by the VMF bot.
2. Go to **OAuth2 → General → Redirects**.
3. Add exactly: `https://vmf-drab.vercel.app/api/admin/auth/callback`.
4. Save changes.
5. Copy the Application ID and OAuth2 Client Secret into the Vercel variables above. Never put the Client Secret or Bot Token in frontend code or GitHub.

The bot must remain in the VMF server and retain permission to read guild members. Keep the Server Members privileged intent enabled in the Developer Portal.

## Deploy

After setting the variables, redeploy the Vercel project. Visit `/admin` and select **Continue with Discord**. An account without either allowed role is denied. The session cookie is HTTP-only, secure on HTTPS, SameSite=Lax, and expires after eight hours.
