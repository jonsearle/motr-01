import { createClient } from "@supabase/supabase-js";
import type { Booking, CreateBookingInput, GarageSettings } from "@/types/db";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function getOrCreateGarageSettings(): Promise<GarageSettings> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("garage_settings")
    .select("id, auto_sms_enabled")
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
    .insert({ auto_sms_enabled: false })
    .select("id, auto_sms_enabled")
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
    .select("id, auto_sms_enabled")
    .single();

  if (error) {
    throw error;
  }

  return data;
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
