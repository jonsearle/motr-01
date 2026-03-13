import { NextResponse } from "next/server";
import { countBookingsByDate } from "@/lib/booking-availability";
import { listBookingsByView } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const bookings = await listBookingsByView("future");
    return NextResponse.json(
      { bookingsByDate: countBookingsByDate(bookings) },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Failed to load booking availability", error);
    return NextResponse.json({ error: "Failed to load booking availability" }, { status: 500 });
  }
}
