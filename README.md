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
