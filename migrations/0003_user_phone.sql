-- Mobile number for WhatsApp notifications. Stored as E.164 (+91XXXXXXXXXX).
-- whatsapp_opt_in: 1 only when the user ticked the consent box (WhatsApp requires opt-in).
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN whatsapp_opt_in INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN phone_updated_at TEXT;
