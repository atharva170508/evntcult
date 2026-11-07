-- M11: rate limit for AI Face Search. One row per search; no face data is stored here.
CREATE TABLE face_search_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  event_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_face_search_user ON face_search_log (user_id, created_at);
