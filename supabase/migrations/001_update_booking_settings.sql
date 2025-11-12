-- Migration: Update booking_settings table
-- Replaces advance_booking_notice_hours with lead_time_days, lead_time_basis, and timezone
-- Source of truth: docs/spanner-dropoff-notes.md
-- 
-- INSTRUCTIONS:
-- Step 1: ✅ DONE - You've already run this (adding new columns)
-- Step 2: Run the SQL below to convert existing advance_booking_notice_hours values to lead_time_days
-- Step 3: After Step 2 works, run the DROP COLUMN statement at the bottom

-- ============================================
-- STEP 2: Convert existing data (RUN THIS NOW)
-- ============================================
-- This converts advance_booking_notice_hours to lead_time_days
-- If you have existing settings with hours values, this will convert them
UPDATE booking_settings 
SET lead_time_days = CASE 
  WHEN advance_booking_notice_hours >= 24 THEN FLOOR(advance_booking_notice_hours / 24)
  WHEN advance_booking_notice_hours > 0 THEN 1
  ELSE 0
END
WHERE advance_booking_notice_hours IS NOT NULL;

-- ============================================
-- STEP 3: Remove old column (RUN AFTER STEP 2 WORKS)
-- ============================================
-- Only run this after you've verified Step 2 worked correctly
-- Remove the comment markers (--) from the line below to activate it:
ALTER TABLE booking_settings DROP COLUMN IF EXISTS advance_booking_notice_hours;

