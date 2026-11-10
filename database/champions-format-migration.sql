-- VMF competition formats migration
ALTER TABLE competition_teams ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'league';
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS round_name TEXT;
CREATE INDEX IF NOT EXISTS fixtures_comp_stage_idx ON fixtures(competition_id, stage);
CREATE INDEX IF NOT EXISTS competition_teams_comp_group_idx ON competition_teams(competition_id, group_name);
