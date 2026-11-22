-- Guest wall posts and reactions, plus an optional page effect (falling emoji) per event.
CREATE TABLE IF NOT EXISTS event_posts (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_event_posts_event ON event_posts(event_id, created_at);
CREATE TABLE IF NOT EXISTS event_post_reactions (
  post_id TEXT NOT NULL REFERENCES event_posts(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  emoji TEXT NOT NULL,
  PRIMARY KEY (post_id, user_id, emoji)
);
ALTER TABLE events ADD COLUMN effect TEXT;
