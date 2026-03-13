import { Suspense } from "react";
import { BookDateTimeClient } from "@/components/book-date-time-client";
import { getFutureBookingsByDateForRequest } from "@/lib/server-data";

export default async function DateTimePage() {
  const bookingsByDate = await getFutureBookingsByDateForRequest();

  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-800 p-6 text-white">Loading...</main>}>
      <BookDateTimeClient initialBookingsByDate={bookingsByDate} />
    </Suspense>
  );
}
