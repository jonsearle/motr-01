ALTER TABLE tracking_events
  DROP CONSTRAINT IF EXISTS tracking_events_event_type_check;

ALTER TABLE tracking_events
  ADD CONSTRAINT tracking_events_event_type_check
  CHECK (
    event_type IN (
      'missed_call',
      'sms_sent',
      'booking_click',
      'booking_completed',
      'booking_completed_mot',
      'booking_completed_interim_service',
      'booking_completed_full_service',
      'booking_completed_diagnostics',
      'booking_completed_custom_job',
      'booking_completed_not_sure',
      'whatsapp_click',
      'call_us_click',
      'entry_website',
      'entry_gmb_booking',
      'page_view_owner_home',
      'page_view_owner_bookings',
      'page_view_motorhq_analytics',
      'page_view_motorhq_settings',
      'page_view_book',
      'page_view_date_time',
      'page_view_mobile',
      'page_view_confirmation',
      'page_view_custom_job',
      'page_view_not_sure',
      'page_view_not_sure_details'
    )
  );
