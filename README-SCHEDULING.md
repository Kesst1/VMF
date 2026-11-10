# VMF matchday scheduling and Discord fixture announcements

## Schedule an entire matchday at once

Use the Discord command:

`/vmf matchday_schedule competition_id:<ID> matchday:<N> date:YYYY-MM-DD time:HH:MM`

This sets the same kickoff date/time for every not-yet-started fixture in that competition and matchday. The time is interpreted in `Europe/Madrid` (including daylight-saving changes). You do not need to schedule each fixture separately.

Example:

`/vmf matchday_schedule competition_id:abc123 matchday:1 date:2026-12-12 time:18:00`

## Publish fixtures in Discord

Use:

`/vmf fixtures_show competition_id:<ID> channel_id:<CHANNEL_ID>`

The bot posts a separate embed section for each matchday. If a team's name exactly matches a Discord role name (case-insensitive), the bot mentions that role. It only enables role mentions for those matched roles; it does not ping @everyone or @here.

The bot needs permission to view and send messages in the destination channel, embed links, and mention the relevant roles. The bot's role must be above the team roles if Discord hierarchy requires it.

## Deployment

Deploy the Next.js project so `/api/admin/fixtures/schedule` is available, then restart/redeploy the Discord bot so the new slash commands register. The bot uses the existing `VMF_API_URL` and `ADMIN_API_KEY` environment variables.
