import { NextResponse } from "next/server";
import { countAllBookings, listTrackingEventCounts } from "@/lib/db";

export async function GET() {
  try {
    const [bookingsCount, trackingCounts] = await Promise.all([countAllBookings(), listTrackingEventCounts()]);

    return NextResponse.json({
      bookings_count: bookingsCount,
      tracking_counts: trackingCounts,
    });
  } catch (error) {
    console.error("Failed to load MotorHQ metrics", error);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }
}
