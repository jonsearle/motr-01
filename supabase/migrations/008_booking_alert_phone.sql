ALTER TABLE garage_settings
  ADD COLUMN IF NOT EXISTS booking_alert_phone text NOT NULL DEFAULT '07968777469';
