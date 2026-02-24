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
  min_booking_notice_days: number;
  max_bookings_per_day: number;
}

export interface UpdateGarageSettingsInput {
  auto_sms_enabled?: boolean;
  garage_name?: string;
  cta_booking_enabled?: boolean;
  cta_whatsapp_enabled?: boolean;
  cta_phone_enabled?: boolean;
  whatsapp_number?: string;
  garage_phone?: string;
  min_booking_notice_days?: number;
  max_bookings_per_day?: number;
}

export type TrackingEventType =
  | "missed_call"
  | "sms_sent"
  | "booking_click"
  | "booking_completed"
  | "whatsapp_click";

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
