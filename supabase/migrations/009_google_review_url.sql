ALTER TABLE garage_settings
  ADD COLUMN IF NOT EXISTS google_review_url text NOT NULL DEFAULT '';
