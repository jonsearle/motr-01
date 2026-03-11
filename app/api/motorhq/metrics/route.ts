import { NextResponse } from "next/server";
import { countAllBookings, listTrackingEventCounts } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [bookingsCount, trackingCounts] = await Promise.all([countAllBookings(), listTrackingEventCounts()]);

    return NextResponse.json(
      {
        bookings_count: bookingsCount,
        tracking_counts: trackingCounts,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Failed to load MotorHQ metrics", error);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }
}
