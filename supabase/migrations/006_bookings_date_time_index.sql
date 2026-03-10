CREATE INDEX IF NOT EXISTS bookings_date_time_idx
  ON bookings (date, time);
