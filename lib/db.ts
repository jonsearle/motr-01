import { createClient } from '@supabase/supabase-js'
import type { BookingSettings, Booking, GarageSiteContent } from '../types/db'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Booking Settings helpers
export async function getBookingSettings(): Promise<BookingSettings | null> {
  const { data, error } = await supabase
    .from('booking_settings')
    .select('*')
    .single()

  if (error) {
    // If no rows found, return null instead of throwing
    if (error.code === 'PGRST116') {
      return null
    }
    throw error
  }

  return data
}

export async function upsertBookingSettings(
  settings: BookingSettings
): Promise<BookingSettings> {
  const { data, error } = await supabase
    .from('booking_settings')
    .upsert(settings, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

// Booking helpers
export async function createBooking(
  data: Omit<Booking, 'id' | 'created_at'>
): Promise<Booking> {
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw error
  }

  return booking
}

export async function getBookingsByMonth(
  year: number,
  month: number
): Promise<Booking[]> {
  // Calculate first and last day of the month
  // Month is 1-indexed (1 = January, 12 = December)
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0) // Last day of the month

  // Format dates as YYYY-MM-DD strings for PostgreSQL date comparison
  const start = startDate.toISOString().split('T')[0]
  const end = endDate.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}

// Garage Site Content helpers
export async function getGarageSiteContent(): Promise<GarageSiteContent | null> {
  const { data, error } = await supabase
    .from('garage_site_content')
    .select('*')
    .single()

  if (error) {
    // If no rows found, return null instead of throwing
    if (error.code === 'PGRST116') {
      return null
    }
    throw error
  }

  return data
}

export async function upsertGarageSiteContent(
  data: GarageSiteContent
): Promise<GarageSiteContent> {
  const { data: updatedData, error } = await supabase
    .from('garage_site_content')
    .upsert(data, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    throw error
  }

  return updatedData
}
