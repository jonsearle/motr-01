-- MOTR revenue wedge schema

CREATE TABLE garage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_sms_enabled boolean NOT NULL DEFAULT false,
  garage_name text NOT NULL DEFAULT 'N1 Mobile Auto Repairs',
  short_code text NOT NULL UNIQUE DEFAULT lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  cta_booking_enabled boolean NOT NULL DEFAULT true,
  cta_whatsapp_enabled boolean NOT NULL DEFAULT true,
  cta_phone_enabled boolean NOT NULL DEFAULT true,
  whatsapp_number text NOT NULL DEFAULT '',
  garage_phone text NOT NULL DEFAULT '',
  booking_alert_phone text NOT NULL DEFAULT '07968777469',
  google_review_url text NOT NULL DEFAULT '',
  min_booking_notice_days integer NOT NULL DEFAULT 2,
  max_bookings_per_day integer NOT NULL DEFAULT 3,
  booking_hours_enabled boolean NOT NULL DEFAULT true,
  opening_hours jsonb NOT NULL DEFAULT '{
    "sun": {"enabled": false, "startHour": 9, "endHour": 17},
    "mon": {"enabled": true, "startHour": 8, "endHour": 18},
    "tue": {"enabled": true, "startHour": 8, "endHour": 18},
    "wed": {"enabled": true, "startHour": 8, "endHour": 18},
    "thu": {"enabled": true, "startHour": 8, "endHour": 18},
    "fri": {"enabled": true, "startHour": 8, "endHour": 18},
    "sat": {"enabled": true, "startHour": 8, "endHour": 14}
  }'::jsonb
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

CREATE INDEX bookings_date_time_idx
  ON bookings (date, time);

CREATE TABLE tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES garage_settings(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (
    event_type IN (
      'missed_call',
      'sms_sent',
      'booking_click',
      'booking_completed',
      'whatsapp_click',
      'entry_website',
      'entry_gmb_booking',
      'page_view_book',
      'page_view_date_time',
      'page_view_mobile',
      'page_view_confirmation',
      'page_view_custom_job',
      'page_view_not_sure',
      'page_view_not_sure_details'
    )
  ),
  timestamp timestamptz NOT NULL DEFAULT now(),
  related_missed_call_id uuid NULL,
  phone_number text NULL
);

CREATE TABLE review_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES garage_settings(id) ON DELETE CASCADE,
  booking_id uuid NULL REFERENCES bookings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message text NOT NULL,
  customer_phone text NULL,
  customer_name text NULL,
  vehicle_reg text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX review_feedback_garage_id_created_at_idx
  ON review_feedback (garage_id, created_at DESC);
