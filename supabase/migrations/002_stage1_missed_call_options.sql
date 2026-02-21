ALTER TABLE garage_settings
  ADD COLUMN IF NOT EXISTS garage_name text NOT NULL DEFAULT 'MOTR',
  ADD COLUMN IF NOT EXISTS short_code text,
  ADD COLUMN IF NOT EXISTS cta_booking_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cta_whatsapp_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cta_phone_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS whatsapp_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS garage_phone text NOT NULL DEFAULT '';

UPDATE garage_settings
SET short_code = lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
WHERE short_code IS NULL OR short_code = '';

ALTER TABLE garage_settings
  ALTER COLUMN short_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS garage_settings_short_code_key
  ON garage_settings(short_code);

CREATE TABLE IF NOT EXISTS tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES garage_settings(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (
    event_type IN ('missed_call', 'sms_sent', 'booking_click', 'booking_completed', 'whatsapp_click')
  ),
  timestamp timestamptz NOT NULL DEFAULT now(),
  related_missed_call_id uuid NULL,
  phone_number text NULL
);

