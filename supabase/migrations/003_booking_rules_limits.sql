ALTER TABLE garage_settings
  ADD COLUMN IF NOT EXISTS min_booking_notice_days integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS max_bookings_per_day integer NOT NULL DEFAULT 3;

ALTER TABLE garage_settings
  ALTER COLUMN min_booking_notice_days SET DEFAULT 2,
  ALTER COLUMN max_bookings_per_day SET DEFAULT 3;

UPDATE garage_settings
SET
  garage_name = 'Jon''s Garage',
  cta_phone_enabled = true,
  min_booking_notice_days = GREATEST(COALESCE(min_booking_notice_days, 2), 1),
  max_bookings_per_day = GREATEST(COALESCE(max_bookings_per_day, 3), 1)
WHERE true;
