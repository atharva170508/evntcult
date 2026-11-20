-- "Interested": save an event without registering (Partiful's Interested, Luma's bookmark).
CREATE TABLE IF NOT EXISTS event_saves (
  user_id    TEXT NOT NULL REFERENCES users(id),
  event_id   TEXT NOT NULL REFERENCES events(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, event_id)
);
CREATE INDEX IF NOT EXISTS idx_event_saves_event ON event_saves(event_id);
