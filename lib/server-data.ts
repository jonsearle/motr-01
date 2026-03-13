import { cache } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { countBookingsByDate } from "@/lib/booking-availability";
import { getOrCreateGarageSettings, listBookingsByView } from "@/lib/db";
import type { Booking, GarageSettings } from "@/types/db";

export const getGarageSettingsForRequest = cache(async (): Promise<GarageSettings> => {
  noStore();
  return getOrCreateGarageSettings();
});

export const getBookingsForViewForRequest = cache(async (view: "future" | "past" | "all"): Promise<Booking[]> => {
  noStore();
  return listBookingsByView(view);
});

export const getFutureBookingsByDateForRequest = cache(async (): Promise<Record<string, number>> => {
  noStore();
  const bookings = await listBookingsByView("future");
  return countBookingsByDate(bookings);
});
