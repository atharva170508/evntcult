-- Sign-up rules: a registration cutoff, host approval, and an agenda (one item per line).
ALTER TABLE events ADD COLUMN reg_closes_at TEXT;
ALTER TABLE events ADD COLUMN requires_approval INTEGER NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN agenda TEXT;
