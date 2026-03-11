import type { OpeningHours } from "@/lib/booking-hours";

export interface GarageSettings {
  id: string;
  auto_sms_enabled: boolean;
  garage_name: string;
  short_code: string;
  cta_booking_enabled: boolean;
  cta_whatsapp_enabled: boolean;
  cta_phone_enabled: boolean;
  whatsapp_number: string;
  garage_phone: string;
  booking_alert_phone: string;
  google_review_url: string;
  min_booking_notice_days: number;
  max_bookings_per_day: number;
  booking_hours_enabled: boolean;
  opening_hours: OpeningHours;
}

export interface UpdateGarageSettingsInput {
  auto_sms_enabled?: boolean;
  garage_name?: string;
  cta_booking_enabled?: boolean;
  cta_whatsapp_enabled?: boolean;
  cta_phone_enabled?: boolean;
  whatsapp_number?: string;
  garage_phone?: string;
  booking_alert_phone?: string;
  google_review_url?: string;
  min_booking_notice_days?: number;
  max_bookings_per_day?: number;
  booking_hours_enabled?: boolean;
  opening_hours?: OpeningHours;
}

export type TrackingEventType =
  | "missed_call"
  | "sms_sent"
  | "booking_click"
  | "booking_completed"
  | "booking_completed_mot"
  | "booking_completed_interim_service"
  | "booking_completed_full_service"
  | "booking_completed_diagnostics"
  | "booking_completed_custom_job"
  | "booking_completed_not_sure"
  | "whatsapp_click"
  | "call_us_click"
  | "entry_website"
  | "entry_gmb_booking"
  | "page_view_owner_home"
  | "page_view_owner_bookings"
  | "page_view_motorhq_analytics"
  | "page_view_motorhq_settings"
  | "page_view_book"
  | "page_view_date_time"
  | "page_view_mobile"
  | "page_view_confirmation"
  | "page_view_custom_job"
  | "page_view_not_sure"
  | "page_view_not_sure_details";

export interface Booking {
  id: string;
  name: string;
  phone: string;
  service_type: string;
  description: string | null;
  date: string;
  time: string;
  created_at: string;
}

export interface CreateBookingInput {
  name: string;
  phone: string;
  service_type: string;
  description?: string;
  date: string;
  time: string;
}

export interface ReviewFeedback {
  id: string;
  rating: number;
  message: string;
  customer_name: string | null;
  vehicle_reg: string | null;
  booking_note: string | null;
  created_at: string;
}
