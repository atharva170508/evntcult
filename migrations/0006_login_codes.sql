-- M6: one-time 6-digit login codes sent by email.
-- Only an HMAC hash of the code is stored, never the code itself.
-- A code expires 10 minutes after it is sent and allows at most 5 wrong tries.
-- Rows double as the rate-limit log (codes sent per email / per IP in a time window).
CREATE TABLE login_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  ip TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  used_at TEXT
);
CREATE INDEX idx_login_codes_email ON login_codes (email, created_at);
CREATE INDEX idx_login_codes_ip ON login_codes (ip, created_at);
