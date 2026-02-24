-- MOTR revenue wedge schema

CREATE TABLE garage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_sms_enabled boolean NOT NULL DEFAULT false,
  garage_name text NOT NULL DEFAULT 'Jon''s Garage',
  short_code text NOT NULL UNIQUE DEFAULT lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  cta_booking_enabled boolean NOT NULL DEFAULT true,
  cta_whatsapp_enabled boolean NOT NULL DEFAULT true,
  cta_phone_enabled boolean NOT NULL DEFAULT true,
  whatsapp_number text NOT NULL DEFAULT '',
  garage_phone text NOT NULL DEFAULT '',
  min_booking_notice_days integer NOT NULL DEFAULT 2,
  max_bookings_per_day integer NOT NULL DEFAULT 3
);

CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  service_type text NOT NULL,
  description text,
  date date NOT NULL,
  time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES garage_settings(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (
    event_type IN ('missed_call', 'sms_sent', 'booking_click', 'booking_completed', 'whatsapp_click')
  ),
  timestamp timestamptz NOT NULL DEFAULT now(),
  related_missed_call_id uuid NULL,
  phone_number text NULL
);
