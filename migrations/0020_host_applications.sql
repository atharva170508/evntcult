-- Hosting is for approved organizers only. Students apply; an admin approves in the owner panel.
-- Approved = users.role 'organizer' (or 'admin'). host_status tracks the application itself.
ALTER TABLE users ADD COLUMN host_status TEXT NOT NULL DEFAULT 'none';   -- none | pending | approved | rejected
ALTER TABLE users ADD COLUMN host_club TEXT;         -- the club or group they host for
ALTER TABLE users ADD COLUMN host_note TEXT;         -- what they plan to run
ALTER TABLE users ADD COLUMN host_applied_at TEXT;
ALTER TABLE users ADD COLUMN host_decided_at TEXT;
-- Everyone who already hosts keeps hosting.
UPDATE users SET host_status = 'approved' WHERE role IN ('organizer', 'admin');
CREATE INDEX IF NOT EXISTS idx_users_host_pending ON users(host_applied_at) WHERE host_status = 'pending';
