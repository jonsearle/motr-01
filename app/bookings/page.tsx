import { BookingsClient } from "@/components/bookings-client";
import { getBookingsForViewForRequest, getGarageSettingsForRequest } from "@/lib/server-data";

export default async function BookingsPage() {
  const [settings, bookings] = await Promise.all([
    getGarageSettingsForRequest(),
    getBookingsForViewForRequest("future"),
  ]);

  return <BookingsClient initialBookings={bookings} initialSettings={settings} />;
}
