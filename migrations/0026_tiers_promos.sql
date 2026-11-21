-- Ticket types and promo codes (JSON on the event), and what each guest actually owes.
ALTER TABLE events ADD COLUMN tiers TEXT;
ALTER TABLE events ADD COLUMN promos TEXT;
ALTER TABLE registrations ADD COLUMN amount_paise INTEGER;
ALTER TABLE registrations ADD COLUMN tier TEXT;
ALTER TABLE registrations ADD COLUMN promo_code TEXT;
