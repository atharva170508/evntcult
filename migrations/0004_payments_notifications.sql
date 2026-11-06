-- M4: payment reconcile details + WhatsApp outbox.

-- How a fee was collected (set by the organizer's "Mark paid"; cleared by "Mark unpaid").
ALTER TABLE registrations ADD COLUMN payment_method TEXT;   -- cash | upi
ALTER TABLE registrations ADD COLUMN payment_ref TEXT;      -- UPI transaction reference (optional)
ALTER TABLE registrations ADD COLUMN paid_at TEXT;
ALTER TABLE registrations ADD COLUMN paid_by TEXT;          -- organizer user id

-- Outbox: every WhatsApp message is queued here first. A sender (once a provider is
-- connected) picks up 'queued' rows. No phone numbers are copied here: the sender reads
-- users.phone at send time, so a student who removes their number isn't messaged.
CREATE TABLE notifications (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  event_id    TEXT REFERENCES events(id),
  channel     TEXT NOT NULL DEFAULT 'whatsapp',       -- whatsapp
  template    TEXT NOT NULL,                           -- pre-approved template name
  payload     TEXT NOT NULL,                           -- JSON template variables
  status      TEXT NOT NULL DEFAULT 'queued',          -- queued | sent | failed
  error       TEXT,
  created_at  TEXT NOT NULL,
  sent_at     TEXT,
  dedupe_key  TEXT UNIQUE                              -- e.g. reminder:<event>:<user>, so nothing is queued twice
);
CREATE INDEX idx_notifications_status ON notifications(status, created_at);
CREATE INDEX idx_notifications_event ON notifications(event_id, status);

-- Was this update also queued for WhatsApp?
ALTER TABLE event_updates ADD COLUMN notified INTEGER NOT NULL DEFAULT 0;
