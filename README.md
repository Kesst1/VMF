# VMF — competition formats update

This package includes the VMF website project plus an updated Discord bridge (`vmf_web.py`).

## Tournament types
- `league`: one round-robin schedule (single match against each opponent).
- `table_elimination`: currently generates the round-robin table stage. The knockout phase must be generated after the table is final.
- `elimination`: creates the first knockout round pairings.
- `champions`: requires exactly 14 or 16 teams; assigns 14 as 4+4+3+3 and 16 as 4+4+4+4, then creates single round-robin group fixtures.

Champions ranking uses points, goal difference, then goals scored. The API exposes `direct` (top 8) and `repechage` (remaining ranking). Repechage is ranking-only, not matches.

## Database
Run `database/champions-format-migration.sql` in Neon before deploying. Back up the database first. It adds `group_name` to `competition_teams` and `stage`, `group_name`, `round_name` to `fixtures`.

## Deploy
1. Keep existing Vercel environment variables and secrets.
2. Run the migration in Neon.
3. Deploy the Next.js project.
4. Replace the bot cog with `vmf_web.py` on Wispbyte.
5. Keep `VMF_API_URL` and `ADMIN_API_KEY` configured in Wispbyte. The key must match Vercel and must never be exposed publicly.
6. Sync Discord application commands / restart the bot after replacing the cog.

## Discord commands
`/vmf competition_create` (format choice), `competition_list`, `competition_delete`, `team_add`, `team_remove`, `fixtures_generate`, `fixtures_list`, `result_report`, `result_confirm`, `standings`.

All commands retain the exact Admin role gate configured in the bot file.

## Safety/limitations in this version
- Deleting a competition or removing a team is blocked after any fixture is live, submitted or confirmed.
- `table_elimination` currently generates only the table stage; knockout generation is not automated yet.
- `elimination` creates first-round pairings but does not yet advance winners automatically.
- Champions top-8/repechage calculation is a ranking output; bracket creation is not yet automated.
- Run a staging test before replacing the live deployment.

### Postpone / reschedule a fixture
- `/vmf postpone fixture_id:<ID>` marks a fixture as `postponed` without assigning a replacement date.
- `/vmf postpone fixture_id:<ID> new_date:YYYY-MM-DD new_time:HH:MM` reschedules it and returns it to `scheduled`.
- `reason` is optional. Obtain the fixture ID from `/vmf fixtures_list`.
- Fixtures that are live, submitted, or confirmed cannot be postponed or rescheduled through this command.
- Times use `Europe/Madrid`.

## Additional Discord administration commands

- `/vmf teams_add_bulk competition_name team_names group_name`: add up to 64 teams to a competition. Enter names separated by commas or new lines. Existing registrations are skipped.
- `/vmf teams_remove_bulk competition_name team_names`: remove up to 64 registrations by team name. It refuses if any fixture in that competition is live, submitted, or confirmed; fixtures involving removed teams are also deleted, along with their reports/events.
- `/vmf delete_all confirmation`: permanently deletes all match events, match reports, fixtures, competition registrations, competitions, and global teams. The confirmation must be exactly `DELETE ALL VMF`. This does not delete verified Discord/Roblox accounts or activity logs.

The bulk endpoints are `/api/admin/competition-teams/bulk` (POST and DELETE) and `/api/admin/delete-all` (POST). They require the existing `ADMIN_API_KEY` header.
