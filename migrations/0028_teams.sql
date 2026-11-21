-- Team sign-up: a captain creates a team (with a join code), teammates join it.
CREATE TABLE IF NOT EXISTS teams (
  id         TEXT PRIMARY KEY,
  event_id   TEXT NOT NULL REFERENCES events(id),
  name       TEXT NOT NULL,
  join_code  TEXT NOT NULL,
  captain_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_code ON teams(event_id, join_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_name ON teams(event_id, lower(name));
ALTER TABLE registrations ADD COLUMN team_id TEXT;
