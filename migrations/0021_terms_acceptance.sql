-- Terms & Conditions and User Rules: when each person accepted, and which version.
-- Everyone (new and existing) accepts once; a new TERMS_VERSION asks everyone again.
ALTER TABLE users ADD COLUMN terms_accepted_at TEXT;
ALTER TABLE users ADD COLUMN terms_version TEXT;
