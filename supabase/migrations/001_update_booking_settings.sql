-- MOTR revenue wedge migration (minimal tables)

CREATE TABLE IF NOT EXISTS garage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_sms_enabled boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  service_type text NOT NULL,
  description text,
  date date NOT NULL,
  time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
