-- 0034_user_face_id.sql
-- Store 128-d face embedding numbers for automatic Photo Vault population
ALTER TABLE users ADD COLUMN face_embedding TEXT;
ALTER TABLE users ADD COLUMN face_updated_at TEXT;

-- Auto-matched photos discovered via Face ID for registered attendees
CREATE TABLE IF NOT EXISTS auto_photo_matches (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),
  event_id      TEXT NOT NULL REFERENCES events(id),
  photo_id      TEXT NOT NULL,
  drive_file_id TEXT,
  thumbnail_url TEXT,
  download_url  TEXT,
  similarity    REAL NOT NULL,
  created_at    TEXT NOT NULL,
  UNIQUE(user_id, photo_id)
);
CREATE INDEX IF NOT EXISTS idx_auto_photo_matches_user ON auto_photo_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_photo_matches_event ON auto_photo_matches(event_id);
