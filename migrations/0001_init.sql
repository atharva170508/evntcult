-- EvntCult D1 schema, v1.
-- Timestamps: ISO 8601 UTC strings. Money: integer paise.

CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'attendee',   -- attendee | organizer | admin
  created_at  TEXT NOT NULL
);

CREATE TABLE events (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL,                    -- GAMING|SPORTS|TECH|CULTURAL|WORKSHOP|TALK|PARTY
  venue         TEXT NOT NULL,
  starts_at     TEXT NOT NULL,                    -- ISO 8601 UTC
  ends_at       TEXT NOT NULL,
  capacity      INTEGER NOT NULL CHECK (capacity > 0),
  price_paise   INTEGER NOT NULL DEFAULT 0,       -- 0 = free
  status        TEXT NOT NULL DEFAULT 'draft',    -- draft|published|closed|cancelled
  access        TEXT NOT NULL DEFAULT 'public',   -- public|code
  access_code   TEXT,
  organizer_id  TEXT NOT NULL REFERENCES users(id),
  banner_key    TEXT,
  created_at    TEXT NOT NULL
);
CREATE INDEX idx_events_starts ON events(starts_at) WHERE status = 'published';

CREATE TABLE registrations (
  id             TEXT PRIMARY KEY,
  event_id       TEXT NOT NULL REFERENCES events(id),
  user_id        TEXT NOT NULL REFERENCES users(id),
  status         TEXT NOT NULL DEFAULT 'registered', -- registered|waitlisted|cancelled
  pass_code      TEXT NOT NULL UNIQUE,               -- display code, e.g. EC-VALO-0042
  pass_token     TEXT NOT NULL UNIQUE,               -- 128-bit base32 secret, encoded in QR
  payment_status TEXT NOT NULL DEFAULT 'unpaid',     -- unpaid|paid
  hold_expires_at TEXT,
  created_at     TEXT NOT NULL,
  cancelled_at   TEXT,
  UNIQUE (event_id, user_id)                         -- one registration per person per event
);
CREATE INDEX idx_reg_event ON registrations(event_id, status);
CREATE INDEX idx_reg_user ON registrations(user_id, status);

CREATE TABLE checkins (
  id              TEXT PRIMARY KEY,
  registration_id TEXT NOT NULL UNIQUE REFERENCES registrations(id),
  event_id        TEXT NOT NULL,
  scanned_at      TEXT NOT NULL,
  device_id       TEXT,
  client_scan_id  TEXT UNIQUE,                       -- idempotency key from the offline queue
  method          TEXT NOT NULL DEFAULT 'qr'         -- qr|manual
);
CREATE INDEX idx_checkin_event ON checkins(event_id);

CREATE TABLE event_updates (
  id         TEXT PRIMARY KEY,
  event_id   TEXT NOT NULL REFERENCES events(id),
  kind       TEXT NOT NULL,                        -- schedule|venue|update
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE photos (
  id          TEXT PRIMARY KEY,
  event_id    TEXT NOT NULL REFERENCES events(id),
  r2_key      TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE audit_log (
  id          TEXT PRIMARY KEY,
  actor_id    TEXT,
  action      TEXT NOT NULL,                       -- register|cancel|capacity_change|checkin|payment
  target_id   TEXT,
  meta        TEXT,                                -- JSON
  created_at  TEXT NOT NULL
);
