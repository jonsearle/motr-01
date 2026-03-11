ALTER TABLE review_feedback
  ADD COLUMN IF NOT EXISTS booking_note text NULL;
