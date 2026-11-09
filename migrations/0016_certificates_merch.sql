-- Certificates issued from real check-ins, and goodies claimed with the pass.
ALTER TABLE events ADD COLUMN certificates_enabled INTEGER NOT NULL DEFAULT 1;

CREATE TABLE certificates (
  id TEXT PRIMARY KEY,
  registration_id TEXT NOT NULL REFERENCES registrations(id),
  event_id TEXT NOT NULL REFERENCES events(id),
  public_code TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL DEFAULT 'participation',
  issued_at TEXT NOT NULL,
  revoked_at TEXT,
  revoked_reason TEXT,
  UNIQUE (registration_id, kind)
);
CREATE INDEX idx_cert_event ON certificates(event_id);

CREATE TABLE merch_items (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id),
  name TEXT NOT NULL,
  variant TEXT,
  stock INTEGER,
  per_pass_limit INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_merch_event ON merch_items(event_id);

CREATE TABLE merch_claims (
  id TEXT PRIMARY KEY,
  registration_id TEXT NOT NULL REFERENCES registrations(id),
  item_id TEXT NOT NULL REFERENCES merch_items(id),
  claimed_at TEXT NOT NULL,
  claimed_by TEXT,
  client_claim_id TEXT UNIQUE,
  UNIQUE (registration_id, item_id)
);
CREATE INDEX idx_merch_claim_item ON merch_claims(item_id);
