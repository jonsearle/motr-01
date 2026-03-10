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
  );
