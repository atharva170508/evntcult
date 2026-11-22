-- Follow a host, an organizer-written refund policy, and attendee reports.
CREATE TABLE IF NOT EXISTS host_follows (
  user_id TEXT NOT NULL REFERENCES users(id),
  host_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, host_id)
);
CREATE INDEX IF NOT EXISTS idx_host_follows_host ON host_follows(host_id);
CREATE TABLE IF NOT EXISTS event_reports (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id),
  user_id TEXT REFERENCES users(id),
  reason TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL
);
ALTER TABLE events ADD COLUMN refund_policy TEXT;
