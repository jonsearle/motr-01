ALTER TABLE review_feedback
  ADD COLUMN IF NOT EXISTS booking_id uuid NULL REFERENCES bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_name text NULL,
  ADD COLUMN IF NOT EXISTS vehicle_reg text NULL;
