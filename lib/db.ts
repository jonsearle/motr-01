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

const GARAGE_SETTINGS_SELECT =
  "id, auto_sms_enabled, garage_name, short_code, cta_booking_enabled, cta_whatsapp_enabled, cta_phone_enabled, whatsapp_number, garage_phone";

function generateShortCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 6).toLowerCase();
}

export async function getOrCreateGarageSettings(): Promise<GarageSettings> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("garage_settings")
    .select(GARAGE_SETTINGS_SELECT)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("garage_settings")
    .insert({
      auto_sms_enabled: false,
      garage_name: "MOTR",
      short_code: generateShortCode(),
      cta_booking_enabled: true,
      cta_whatsapp_enabled: true,
      cta_phone_enabled: true,
      whatsapp_number: "",
      garage_phone: "",
    })
    .select(GARAGE_SETTINGS_SELECT)
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted;
}

export async function setAutoSmsEnabled(enabled: boolean): Promise<GarageSettings> {
  const supabase = getSupabaseClient();
  const current = await getOrCreateGarageSettings();

  const { data, error } = await supabase
    .from("garage_settings")
    .update({ auto_sms_enabled: enabled })
    .eq("id", current.id)
    .select(GARAGE_SETTINGS_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

function isCtaOrContactUpdate(input: UpdateGarageSettingsInput): boolean {
  return (
    typeof input.cta_booking_enabled === "boolean" ||
    typeof input.cta_whatsapp_enabled === "boolean" ||
    typeof input.cta_phone_enabled === "boolean" ||
    typeof input.whatsapp_number === "string" ||
    typeof input.garage_phone === "string" ||
    typeof input.garage_name === "string"
  );
}

function assertValidCtaConfig(next: GarageSettings): void {
  const ctaCount = Number(next.cta_booking_enabled) + Number(next.cta_whatsapp_enabled) + Number(next.cta_phone_enabled);
  if (ctaCount < 1) {
    throw new Error("At least one CTA must be enabled.");
  }

  if (next.cta_whatsapp_enabled && !normalizeWhatsappNumber(next.whatsapp_number)) {
    throw new Error("WhatsApp number is required when WhatsApp CTA is enabled.");
  }

  if (next.cta_phone_enabled && !normalizePhoneInput(next.garage_phone)) {
    throw new Error("Phone number is required when phone CTA is enabled.");
  }
}

export async function updateGarageSettings(input: UpdateGarageSettingsInput): Promise<GarageSettings> {
  const supabase = getSupabaseClient();
  const current = await getOrCreateGarageSettings();

  const updatePayload: Record<string, unknown> = {};
  if (typeof input.auto_sms_enabled === "boolean") updatePayload.auto_sms_enabled = input.auto_sms_enabled;
  if (typeof input.garage_name === "string") updatePayload.garage_name = input.garage_name.trim();
  if (typeof input.cta_booking_enabled === "boolean") updatePayload.cta_booking_enabled = input.cta_booking_enabled;
  if (typeof input.cta_whatsapp_enabled === "boolean") updatePayload.cta_whatsapp_enabled = input.cta_whatsapp_enabled;
  if (typeof input.cta_phone_enabled === "boolean") updatePayload.cta_phone_enabled = input.cta_phone_enabled;
  if (typeof input.whatsapp_number === "string") {
    updatePayload.whatsapp_number = normalizePhoneInput(input.whatsapp_number);
  }
  if (typeof input.garage_phone === "string") {
    updatePayload.garage_phone = normalizePhoneInput(input.garage_phone);
  }

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
    .select(GARAGE_SETTINGS_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getGarageSettingsByShortCode(code: string): Promise<GarageSettings | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("garage_settings")
    .select(GARAGE_SETTINGS_SELECT)
    .eq("short_code", code.toLowerCase())
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
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
