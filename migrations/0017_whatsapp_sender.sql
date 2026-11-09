-- WhatsApp sender: consent timestamps, schedule and delivery details.
-- Dedupe keys already end in the user id, so the existing UNIQUE (dedupe_key) means one per key per person.
ALTER TABLE users ADD COLUMN wa_opt_in_at TEXT;
ALTER TABLE users ADD COLUMN wa_opt_out_at TEXT;
UPDATE users SET wa_opt_in_at = phone_updated_at WHERE whatsapp_opt_in = 1;

ALTER TABLE notifications ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE notifications ADD COLUMN provider_id TEXT;
ALTER TABLE notifications ADD COLUMN scheduled_for TEXT;
UPDATE notifications SET scheduled_for = created_at;
CREATE INDEX idx_notif_due ON notifications(status, scheduled_for);
