CREATE TABLE IF NOT EXISTS review_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES garage_settings(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message text NOT NULL,
  customer_phone text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS review_feedback_garage_id_created_at_idx
  ON review_feedback (garage_id, created_at DESC);
