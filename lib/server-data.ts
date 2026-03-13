import { cache } from "react";
import { countBookingsByDate } from "@/lib/booking-availability";
import { getOrCreateGarageSettings, listBookingsByView } from "@/lib/db";
import type { Booking, GarageSettings } from "@/types/db";

export const getGarageSettingsForRequest = cache(async (): Promise<GarageSettings> => {
  return getOrCreateGarageSettings();
});

export const getBookingsForViewForRequest = cache(async (view: "future" | "past" | "all"): Promise<Booking[]> => {
  return listBookingsByView(view);
});

export const getFutureBookingsByDateForRequest = cache(async (): Promise<Record<string, number>> => {
  const bookings = await listBookingsByView("future");
  return countBookingsByDate(bookings);
});
