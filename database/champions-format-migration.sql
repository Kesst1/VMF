-- VMF competition formats migration
ALTER TABLE competition_teams ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'league';
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS round_name TEXT;
CREATE INDEX IF NOT EXISTS fixtures_comp_stage_idx ON fixtures(competition_id, stage);
CREATE INDEX IF NOT EXISTS competition_teams_comp_group_idx ON competition_teams(competition_id, group_name);

-- Stores teams that qualify directly for the quarter-finals in the 12-team knockout format.
CREATE TABLE IF NOT EXISTS competition_bracket_byes (
  competition_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  enters_round TEXT NOT NULL DEFAULT 'Quarter-finals',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (competition_id, team_id, enters_round)
);
