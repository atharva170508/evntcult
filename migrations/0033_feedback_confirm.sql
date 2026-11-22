-- Post-event feedback (1 to 5 stars and a note) and the host's message shown after sign-up.
CREATE TABLE IF NOT EXISTS event_feedback (
  event_id TEXT NOT NULL REFERENCES events(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (event_id, user_id)
);
ALTER TABLE events ADD COLUMN confirm_message TEXT;
