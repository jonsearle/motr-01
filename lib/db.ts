import { createClient } from "@supabase/supabase-js";
import { assertValidOpeningHours, DEFAULT_OPENING_HOURS, normalizeOpeningHours } from "@/lib/booking-hours";
import { normalizePhoneInput, normalizeWhatsappNumber } from "@/lib/missed-call";
import type {
  Booking,
  CreateBookingInput,
  GarageSettings,
  ReviewFeedback,
  TrackingEventType,
  UpdateGarageSettingsInput,
} from "@/types/db";

const DEFAULT_GARAGE_NAME = "N1 Mobile Auto Repairs";
const DEFAULT_BOOKING_ALERT_PHONE = "07968777469";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "t" || normalized === "1") return true;
    if (normalized === "false" || normalized === "f" || normalized === "0") return false;
  }
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  return fallback;
}

function normalizeGarageSettings(raw: Record<string, unknown>): GarageSettings {
  const googleReviewUrl =
    typeof raw.google_review_url === "string" && raw.google_review_url.trim() ? raw.google_review_url.trim() : "";

  return {
    id: String(raw.id ?? ""),
    auto_sms_enabled: toBoolean(raw.auto_sms_enabled, false),
    garage_name:
      typeof raw.garage_name === "string" && raw.garage_name.trim() && raw.garage_name.trim() !== "Jon's Garage"
        ? raw.garage_name.trim()
        : DEFAULT_GARAGE_NAME,
    short_code: typeof raw.short_code === "string" && raw.short_code.trim() ? raw.short_code : generateShortCode(),
    cta_booking_enabled: toBoolean(raw.cta_booking_enabled, true),
    cta_whatsapp_enabled: toBoolean(raw.cta_whatsapp_enabled, true),
    cta_phone_enabled: toBoolean(raw.cta_phone_enabled, true),
    whatsapp_number: typeof raw.whatsapp_number === "string" ? raw.whatsapp_number : "",
    garage_phone: typeof raw.garage_phone === "string" ? raw.garage_phone : "",
    booking_alert_phone:
      typeof raw.booking_alert_phone === "string" && raw.booking_alert_phone.trim()
        ? raw.booking_alert_phone
        : DEFAULT_BOOKING_ALERT_PHONE,
    google_review_url: googleReviewUrl,
    min_booking_notice_days:
      typeof raw.min_booking_notice_days === "number" && Number.isInteger(raw.min_booking_notice_days)
        ? Math.max(1, raw.min_booking_notice_days)
        : 2,
    max_bookings_per_day:
      typeof raw.max_bookings_per_day === "number" && Number.isInteger(raw.max_bookings_per_day)
        ? Math.max(1, raw.max_bookings_per_day)
        : 3,
    booking_hours_enabled: toBoolean(raw.booking_hours_enabled, true),
    opening_hours: normalizeOpeningHours(raw.opening_hours),
  };
}

function generateShortCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 6).toLowerCase();
}

export async function getOrCreateGarageSettings(): Promise<GarageSettings> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("garage_settings")
    .select("*")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return normalizeGarageSettings(data as Record<string, unknown>);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("garage_settings")
    .insert({
      auto_sms_enabled: false,
      garage_name: DEFAULT_GARAGE_NAME,
      short_code: generateShortCode(),
      cta_booking_enabled: true,
      cta_whatsapp_enabled: true,
      cta_phone_enabled: true,
      whatsapp_number: "",
      garage_phone: "",
      booking_alert_phone: DEFAULT_BOOKING_ALERT_PHONE,
      google_review_url: "",
      booking_hours_enabled: true,
      opening_hours: DEFAULT_OPENING_HOURS,
    })
    .select("*")
    .single();

  if (insertError) {
    throw insertError;
  }

  return normalizeGarageSettings(inserted as Record<string, unknown>);
}

export async function setAutoSmsEnabled(enabled: boolean): Promise<GarageSettings> {
  const supabase = getSupabaseClient();
  const current = await getOrCreateGarageSettings();

  const { data, error } = await supabase
    .from("garage_settings")
    .update({ auto_sms_enabled: enabled })
    .eq("id", current.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return normalizeGarageSettings(data as Record<string, unknown>);
}

function isCtaOrContactUpdate(input: UpdateGarageSettingsInput): boolean {
  return (
    typeof input.cta_booking_enabled === "boolean" ||
    typeof input.cta_whatsapp_enabled === "boolean" ||
    typeof input.whatsapp_number === "string" ||
    typeof input.garage_phone === "string"
  );
}

function isBookingRulesUpdate(input: UpdateGarageSettingsInput): boolean {
  return (
    typeof input.min_booking_notice_days === "number" ||
    typeof input.max_bookings_per_day === "number" ||
    typeof input.booking_hours_enabled === "boolean" ||
    typeof input.opening_hours === "object"
  );
}

function assertValidCtaConfig(next: GarageSettings): void {
  const ctaCount = Number(next.cta_booking_enabled) + Number(next.cta_whatsapp_enabled) + 1;
  if (ctaCount < 1) {
    throw new Error("At least one CTA must be enabled.");
  }

  if (next.cta_whatsapp_enabled && !normalizeWhatsappNumber(next.whatsapp_number)) {
    throw new Error("WhatsApp number is required when WhatsApp CTA is enabled.");
  }
}

function assertValidBookingRules(next: GarageSettings): void {
  if (!Number.isInteger(next.min_booking_notice_days) || next.min_booking_notice_days < 1) {
    throw new Error("Minimum booking notice must be at least 1 day.");
  }

  if (!Number.isInteger(next.max_bookings_per_day) || next.max_bookings_per_day < 1) {
    throw new Error("Daily booking limit must be at least 1.");
  }

  if (next.booking_hours_enabled) {
    assertValidOpeningHours(next.opening_hours);
  }
}

export async function updateGarageSettings(input: UpdateGarageSettingsInput): Promise<GarageSettings> {
  const supabase = getSupabaseClient();
  const current = await getOrCreateGarageSettings();

  const updatePayload: Record<string, unknown> = {};
  if (typeof input.auto_sms_enabled === "boolean") updatePayload.auto_sms_enabled = input.auto_sms_enabled;
  if (typeof input.garage_name === "string" && input.garage_name.trim()) {
    updatePayload.garage_name = input.garage_name.trim();
  }
  if (typeof input.cta_booking_enabled === "boolean") updatePayload.cta_booking_enabled = input.cta_booking_enabled;
  if (typeof input.cta_whatsapp_enabled === "boolean") updatePayload.cta_whatsapp_enabled = input.cta_whatsapp_enabled;
  if (typeof input.whatsapp_number === "string") {
    updatePayload.whatsapp_number = normalizePhoneInput(input.whatsapp_number);
  }
  if (typeof input.garage_phone === "string") {
    updatePayload.garage_phone = normalizePhoneInput(input.garage_phone);
  }
  if (typeof input.booking_alert_phone === "string") {
    updatePayload.booking_alert_phone = normalizePhoneInput(input.booking_alert_phone);
  }
  if (typeof input.google_review_url === "string") {
    updatePayload.google_review_url = input.google_review_url.trim();
  }
  if (typeof input.min_booking_notice_days === "number") {
    updatePayload.min_booking_notice_days = Math.floor(input.min_booking_notice_days);
  }
  if (typeof input.max_bookings_per_day === "number") {
    updatePayload.max_bookings_per_day = Math.floor(input.max_bookings_per_day);
  }
  if (typeof input.booking_hours_enabled === "boolean") {
    updatePayload.booking_hours_enabled = input.booking_hours_enabled;
  }
  if (typeof input.opening_hours === "object") {
    updatePayload.opening_hours = normalizeOpeningHours(input.opening_hours);
  }
  updatePayload.cta_phone_enabled = true;

  const nextState: GarageSettings = {
    ...current,
    ...updatePayload,
  };

  if (isCtaOrContactUpdate(input)) {
    assertValidCtaConfig(nextState);
  }
  if (isBookingRulesUpdate(input)) {
    assertValidBookingRules(nextState);
  }

  const { data, error } = await supabase
    .from("garage_settings")
    .update(updatePayload)
    .eq("id", current.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return normalizeGarageSettings(data as Record<string, unknown>);
}

export async function getGarageSettingsByShortCode(code: string): Promise<GarageSettings | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("garage_settings")
    .select("*")
    .eq("short_code", code.toLowerCase())
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? normalizeGarageSettings(data as Record<string, unknown>) : null;
}

export async function logTrackingEvent(input: {
  garage_id: string;
  event_type: TrackingEventType;
  related_missed_call_id?: string | null;
  phone_number?: string | null;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("tracking_events").insert({
    garage_id: input.garage_id,
    event_type: input.event_type,
    related_missed_call_id: input.related_missed_call_id ?? null,
    phone_number: input.phone_number ?? null,
  });

  if (error) {
    throw error;
  }
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const supabase = getSupabaseClient();
  const payload = {
    name: input.name,
    phone: input.phone,
    service_type: input.service_type,
    description: input.description?.trim() ? input.description.trim() : null,
    date: input.date,
    time: input.time,
  };

  const { data, error } = await supabase
    .from("bookings")
    .insert(payload)
    .select("id, name, phone, service_type, description, date, time, created_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createReviewFeedback(input: {
  garage_id: string;
  rating: number;
  message: string;
  customer_phone?: string | null;
  booking_id?: string | null;
  customer_name?: string | null;
  vehicle_reg?: string | null;
  booking_note?: string | null;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("review_feedback").insert({
    garage_id: input.garage_id,
    rating: input.rating,
    message: input.message.trim(),
    customer_phone: input.customer_phone ?? null,
    booking_id: input.booking_id ?? null,
    customer_name: input.customer_name ?? null,
    vehicle_reg: input.vehicle_reg ?? null,
    booking_note: input.booking_note ?? null,
  });

  if (error) {
    throw error;
  }
}

export async function listReviewFeedback(garageId: string): Promise<ReviewFeedback[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("review_feedback")
    .select("id, rating, message, customer_name, vehicle_reg, booking_note, created_at")
    .eq("garage_id", garageId)
    .lte("rating", 3)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ReviewFeedback[];
}

export async function listBookings(): Promise<Booking[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, name, phone, service_type, description, date, time, created_at")
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listBookingsByView(view: "future" | "past" | "all"): Promise<Booking[]> {
  const supabase = getSupabaseClient();
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayIso = `${yyyy}-${mm}-${dd}`;

  let query = supabase
    .from("bookings")
    .select("id, name, phone, service_type, description, date, time, created_at")
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (view === "future") {
    query = query.gte("date", todayIso);
  } else if (view === "past") {
    query = query.lt("date", todayIso);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, name, phone, service_type, description, date, time, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteBooking(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

export async function countBookingsOnDate(date: string): Promise<number> {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("date", date);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function countAllBookings(): Promise<number> {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase.from("bookings").select("id", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function listTrackingEventCounts(): Promise<Record<string, number>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("tracking_events").select("event_type");

  if (error) {
    throw error;
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const key = typeof row.event_type === "string" ? row.event_type : "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return counts;
}
