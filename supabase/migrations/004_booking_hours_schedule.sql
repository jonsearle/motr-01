ALTER TABLE garage_settings
  ALTER COLUMN garage_name SET DEFAULT 'N1 Mobile Auto Repairs';

UPDATE garage_settings
SET garage_name = 'N1 Mobile Auto Repairs'
WHERE garage_name = 'Jon''s Garage' OR garage_name IS NULL OR trim(garage_name) = '';

ALTER TABLE garage_settings
  ADD COLUMN IF NOT EXISTS booking_hours_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS opening_hours jsonb NOT NULL DEFAULT '{
    "sun": {"enabled": false, "startHour": 9, "endHour": 17},
    "mon": {"enabled": true,  "startHour": 8, "endHour": 18},
    "tue": {"enabled": true,  "startHour": 8, "endHour": 18},
    "wed": {"enabled": true,  "startHour": 8, "endHour": 18},
    "thu": {"enabled": true,  "startHour": 8, "endHour": 18},
    "fri": {"enabled": true,  "startHour": 8, "endHour": 18},
    "sat": {"enabled": true,  "startHour": 8, "endHour": 14}
  }'::jsonb;
