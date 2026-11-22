-- Event page views per IST day and source, for Insights.
CREATE TABLE IF NOT EXISTS event_views (
  event_id TEXT NOT NULL REFERENCES events(id),
  day TEXT NOT NULL,
  source TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (event_id, day, source)
);
