-- 0035_discovery_pages.sql
-- Subscriptions for /city/[slug] and /category/[slug] discovery pages (Luma teardown #2 & #3)
CREATE TABLE IF NOT EXISTS topic_subscriptions (
  user_id    TEXT NOT NULL REFERENCES users(id),
  topic_kind TEXT NOT NULL,
  topic_slug TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, topic_kind, topic_slug)
);
CREATE INDEX IF NOT EXISTS idx_topic_subs_lookup ON topic_subscriptions(topic_kind, topic_slug);

-- Community event submissions on /city/[slug] pages
CREATE TABLE IF NOT EXISTS city_submissions (
  id         TEXT PRIMARY KEY,
  city_slug  TEXT NOT NULL,
  user_id    TEXT REFERENCES users(id),
  title      TEXT NOT NULL,
  event_url  TEXT,
  note       TEXT,
  status     TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_city_submissions_city ON city_submissions(city_slug, created_at);
