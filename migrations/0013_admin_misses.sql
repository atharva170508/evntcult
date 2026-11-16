-- Owner panel: wrong secret-code tries per IP, for the 5-misses-in-15-minutes limit.
CREATE TABLE admin_misses (
  ip TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX idx_admin_misses ON admin_misses(ip, at);

-- Owners can block a user. A blocked user is treated as signed out everywhere.
ALTER TABLE users ADD COLUMN blocked_at TEXT;
