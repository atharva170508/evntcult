-- UPI payments: the student submits the transaction ID, the organizer checks it against their bank app.
-- payment_status stays 'unpaid' until the organizer confirms. "To verify" = unpaid with upi_utr set.

ALTER TABLE registrations ADD COLUMN upi_utr TEXT;          -- 12-digit UPI transaction ID from the student
ALTER TABLE registrations ADD COLUMN upi_claimed_at TEXT;
ALTER TABLE registrations ADD COLUMN upi_rejected_at TEXT;  -- organizer couldn't find it, the student can try again

-- One UPI payment can only ever back one pass.
CREATE UNIQUE INDEX idx_reg_upi_utr ON registrations(upi_utr) WHERE upi_utr IS NOT NULL;
