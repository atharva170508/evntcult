-- Event posters, resized in the browser (about 1200px WebP) and kept in D1 until R2 is enabled.
CREATE TABLE IF NOT EXISTS event_posters (
  event_id   TEXT PRIMARY KEY REFERENCES events(id),
  mime       TEXT NOT NULL,
  data       BLOB NOT NULL,
  updated_at TEXT NOT NULL
);
