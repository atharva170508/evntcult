-- Organizer dashboard, part 2: rebuild events so a draft can be incomplete.
-- SQLite can't drop NOT NULL in place, so the table is rebuilt.
--   capacity NULL = unlimited (replaces the old 100000 placeholder)
--   category NULL = not picked yet (drafts only, publish requires it)
--   venue NULL    = TBA or online
-- Every other column and every row is kept. Order matters: registrations, check-ins, updates and
-- photos point at events(id). DROP marks them as orphaned until commit, and only INSERTing the
-- parent rows clears that mark (renaming a table into place does not). So: copy aside, drop,
-- create the real table, insert back.
PRAGMA defer_foreign_keys = true;

CREATE TABLE events_rebuild_copy AS SELECT * FROM events;

DROP TABLE events;

CREATE TABLE events (
  id               TEXT PRIMARY KEY,
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT CHECK (category IN ('PARTY','CULTURAL','TECH','GAMING','SPORTS','WORKSHOP','TALK')),
  venue            TEXT,
  starts_at        TEXT NOT NULL,
  ends_at          TEXT NOT NULL,
  capacity         INTEGER CHECK (capacity IS NULL OR capacity > 0),
  price_paise      INTEGER NOT NULL DEFAULT 0 CHECK (price_paise >= 0),
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','closed','cancelled')),
  access           TEXT NOT NULL DEFAULT 'public' CHECK (access IN ('public','code')),
  access_code      TEXT,
  organizer_id     TEXT NOT NULL REFERENCES users(id),
  banner_key       TEXT,
  created_at       TEXT NOT NULL,
  event_type       TEXT NOT NULL DEFAULT 'in_person' CHECK (event_type IN ('in_person','virtual')),
  meeting_url      TEXT,
  tagline          TEXT,
  organizer_upi_id TEXT,
  drive_folder_url TEXT,
  banner_url       TEXT,
  version          INTEGER NOT NULL DEFAULT 1,
  venue_status     TEXT NOT NULL DEFAULT 'confirmed' CHECK (venue_status IN ('confirmed','tba','online')),
  timezone         TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  published_at     TEXT,
  CHECK (ends_at > starts_at),
  CHECK (access = 'public' OR access_code IS NOT NULL)
);

INSERT INTO events (id, slug, title, description, category, venue, starts_at, ends_at, capacity, price_paise, status, access, access_code,
                        organizer_id, banner_key, created_at, event_type, meeting_url, tagline, organizer_upi_id, drive_folder_url, banner_url,
                        version, venue_status, timezone, updated_at, published_at)
SELECT id, slug, title, description, category, venue, starts_at, ends_at,
       CASE WHEN capacity >= 100000 THEN NULL ELSE capacity END,
       price_paise, status, access, access_code,
       organizer_id, banner_key, created_at, event_type, meeting_url, tagline, organizer_upi_id, drive_folder_url, banner_url,
       version, venue_status, timezone, COALESCE(updated_at, created_at), published_at
FROM events_rebuild_copy;

DROP TABLE events_rebuild_copy;

CREATE INDEX idx_events_starts ON events(starts_at) WHERE status = 'published';
CREATE UNIQUE INDEX idx_events_code ON events(access_code) WHERE access_code IS NOT NULL;
CREATE INDEX idx_events_org ON events(organizer_id, status, starts_at);
