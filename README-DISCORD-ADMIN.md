# VMF Admin — Discord role access

The `/admin` page and every `/api/admin/*` management endpoint are protected by Discord OAuth2 and a live role check against the official VMF Discord server.

## Allowed roles

- Commissioner: `1457406868136788202`
- Staff: `1457406868136788193`
- Guild: `1457406867960762583`

Only members who currently have one of those two roles can enter the admin workspace or use its management APIs. Role membership is checked with the Discord bot on every protected request, so removing a role revokes access without waiting for the eight-hour session to expire.

## Vercel environment variables

Add these in **Vercel → Project → Settings → Environment Variables** for Production (and Preview if you want the same protection there):

| Variable | Value |
|---|---|
| `DISCORD_CLIENT_ID` | Application ID from Discord Developer Portal → OAuth2 → General |
| `DISCORD_CLIENT_SECRET` | OAuth2 Client Secret from the same Discord application. This is NOT the bot token. |
| `DISCORD_REDIRECT_URI` | `https://vmf-drab.vercel.app/api/admin/auth/callback` |
| `DISCORD_BOT_TOKEN` | Existing private bot token; keep it server-side only. |
| `ADMIN_SESSION_SECRET` | A new random secret of at least 32 characters. Generate one with `openssl rand -base64 48`. |

Keep the existing `DATABASE_URL` and Roblox OAuth variables. `ADMIN_API_KEY` is still used by the separate Discord-to-Roblox verification-management endpoints; it is no longer used by the `/admin` workspace or its fixture-management APIs.

## Discord Developer Portal

1. Open the Discord application used by the VMF bot.
2. Go to **OAuth2 → General → Redirects**.
3. Add exactly: `https://vmf-drab.vercel.app/api/admin/auth/callback`.
4. Save changes.
5. Copy the Application ID and OAuth2 Client Secret into the Vercel variables above. Never put the Client Secret or Bot Token in frontend code or GitHub.

The bot must remain in the VMF server and retain permission to read guild members. Keep the Server Members privileged intent enabled in the Developer Portal.

## Deploy

After setting the variables, redeploy the Vercel project. Visit `/admin` and select **Continue with Discord**. An account without either allowed role is denied. The session cookie is HTTP-only, secure on HTTPS, SameSite=Lax, and expires after eight hours.
