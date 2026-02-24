import { createClient } from "@supabase/supabase-js";
import { normalizePhoneInput, normalizeWhatsappNumber } from "@/lib/missed-call";
import type {
  Booking,
  CreateBookingInput,
  GarageSettings,
  TrackingEventType,
  UpdateGarageSettingsInput,
} from "@/types/db";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function normalizeGarageSettings(raw: Record<string, unknown>): GarageSettings {
  return {
    id: String(raw.id ?? ""),
    auto_sms_enabled: !!raw.auto_sms_enabled,
    garage_name: "Jon's Garage",
    short_code: typeof raw.short_code === "string" && raw.short_code.trim() ? raw.short_code : generateShortCode(),
    cta_booking_enabled: typeof raw.cta_booking_enabled === "boolean" ? raw.cta_booking_enabled : true,
    cta_whatsapp_enabled: typeof raw.cta_whatsapp_enabled === "boolean" ? raw.cta_whatsapp_enabled : true,
    cta_phone_enabled: true,
    whatsapp_number: typeof raw.whatsapp_number === "string" ? raw.whatsapp_number : "",
    garage_phone: typeof raw.garage_phone === "string" ? raw.garage_phone : "",
    min_booking_notice_days:
      typeof raw.min_booking_notice_days === "number" && Number.isInteger(raw.min_booking_notice_days)
        ? Math.max(1, raw.min_booking_notice_days)
        : 2,
    max_bookings_per_day:
      typeof raw.max_bookings_per_day === "number" && Number.isInteger(raw.max_bookings_per_day)
        ? Math.max(1, raw.max_bookings_per_day)
        : 3,
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
      garage_name: "Jon's Garage",
      short_code: generateShortCode(),
      cta_booking_enabled: true,
      cta_whatsapp_enabled: true,
      cta_phone_enabled: true,
      whatsapp_number: "",
      garage_phone: "",
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
    typeof input.garage_phone === "string" ||
    typeof input.min_booking_notice_days === "number" ||
    typeof input.max_bookings_per_day === "number"
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

  if (!normalizePhoneInput(next.garage_phone)) {
    throw new Error("Phone number is required when phone CTA is enabled.");
  }

  if (!Number.isInteger(next.min_booking_notice_days) || next.min_booking_notice_days < 1) {
    throw new Error("Minimum booking notice must be at least 1 day.");
  }

  if (!Number.isInteger(next.max_bookings_per_day) || next.max_bookings_per_day < 1) {
    throw new Error("Daily booking limit must be at least 1.");
  }
}

export async function updateGarageSettings(input: UpdateGarageSettingsInput): Promise<GarageSettings> {
  const supabase = getSupabaseClient();
  const current = await getOrCreateGarageSettings();

  const updatePayload: Record<string, unknown> = {};
  if (typeof input.auto_sms_enabled === "boolean") updatePayload.auto_sms_enabled = input.auto_sms_enabled;
  if (typeof input.cta_booking_enabled === "boolean") updatePayload.cta_booking_enabled = input.cta_booking_enabled;
  if (typeof input.cta_whatsapp_enabled === "boolean") updatePayload.cta_whatsapp_enabled = input.cta_whatsapp_enabled;
  if (typeof input.whatsapp_number === "string") {
    updatePayload.whatsapp_number = normalizePhoneInput(input.whatsapp_number);
  }
  if (typeof input.garage_phone === "string") {
    updatePayload.garage_phone = normalizePhoneInput(input.garage_phone);
  }
  if (typeof input.min_booking_notice_days === "number") {
    updatePayload.min_booking_notice_days = Math.floor(input.min_booking_notice_days);
  }
  if (typeof input.max_bookings_per_day === "number") {
    updatePayload.max_bookings_per_day = Math.floor(input.max_bookings_per_day);
  }
  updatePayload.garage_name = "Jon's Garage";
  updatePayload.cta_phone_enabled = true;

  const nextState: GarageSettings = {
    ...current,
    ...updatePayload,
  };

  if (isCtaOrContactUpdate(input)) {
    assertValidCtaConfig(nextState);
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
