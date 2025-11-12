-- Spanner Drop-Off Database Schema
-- Source of truth: docs/spanner-dropoff-notes.md

-- booking_settings: Defines how bookings work and when the business is open
CREATE TABLE booking_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_days jsonb NOT NULL,
  lead_time_days integer NOT NULL DEFAULT 0,
  lead_time_basis text NOT NULL DEFAULT 'working_days',
  timezone text NOT NULL DEFAULT 'Europe/London',
  daily_booking_limit integer NOT NULL,
  notification_name text NOT NULL,
  notification_email text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- bookings: Stores all customer booking records
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time time,
  appointment_type text NOT NULL,
  issue_description text,
  customer_name text NOT NULL,
  customer_mobile text NOT NULL,
  vehicle_reg text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- garage_site_content: Holds the editable content for the public-facing garage website
CREATE TABLE garage_site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text,
  tagline text,
  about_text text,
  address_line1 text,
  address_line2 text,
  city text,
  postcode text,
  phone text,
  email text,
  services jsonb,
  reviews jsonb,
  google_reviews_link text,
  created_at timestamptz DEFAULT now() NOT NULL
);

