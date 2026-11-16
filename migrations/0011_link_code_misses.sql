-- /c/:code short links: wrong guesses per IP, for the 20-misses-a-minute limit.
CREATE TABLE link_code_misses (
  ip TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX idx_link_code_misses ON link_code_misses(ip, at);
