// Database TypeScript types
// Source of truth: docs/spanner-dropoff-notes.md
// These types match the SQL schema in supabase/schema.sql

export type OpeningDay = {
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  is_open: boolean;
  business_open_time: string;
  business_close_time: string;
  dropoff_from_time: string;
  dropoff_to_time: string;
};

export type Service = {
  service_name: string;
  description: string;
};

export type Review = {
  customer_name: string;
  review_text: string;
  stars: number;
};

export interface BookingSettings {
  id: string;
  opening_days: OpeningDay[];
  lead_time_days: number;
  lead_time_basis: 'working_days';
  timezone: string;
  daily_booking_limit: number;
  notification_name: string;
  notification_email: string;
  created_at: string;
}

export interface Booking {
  id: string;
  date: string;
  time?: string; // Optional: expected arrival time (HH:MM format)
  appointment_type: string;
  issue_description?: string;
  customer_name: string;
  customer_mobile: string;
  vehicle_reg?: string;
  created_at: string;
}

export interface GarageSiteContent {
  id: string;
  business_name?: string;
  tagline?: string;
  about_text?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postcode?: string;
  phone?: string;
  email?: string;
  services?: Service[];
  reviews?: Review[];
  google_reviews_link?: string;
  created_at: string;
}

