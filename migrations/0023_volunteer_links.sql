-- Volunteer gate links: let helpers scan one event without an account.
-- Only a SHA-256 of the token is stored; the link itself is shown to the organizer once.
CREATE TABLE IF NOT EXISTS volunteer_links (
  id           TEXT PRIMARY KEY,
  event_id     TEXT NOT NULL REFERENCES events(id),
  token_hash   TEXT NOT NULL UNIQUE,
  label        TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'gate',   -- gate | gate_merch
  created_by   TEXT NOT NULL REFERENCES users(id),
  created_at   TEXT NOT NULL,
  expires_at   TEXT NOT NULL,
  revoked_at   TEXT,
  last_used_at TEXT,
  scans        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_volunteer_links_event ON volunteer_links(event_id);
