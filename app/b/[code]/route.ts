import { NextRequest, NextResponse } from "next/server";
import { getGarageSettingsByShortCode, logTrackingEvent } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params;

  try {
    const settings = await getGarageSettingsByShortCode(code);
    if (!settings) {
      return NextResponse.json({ error: "Unknown booking link" }, { status: 404 });
    }

    try {
      await logTrackingEvent({
        garage_id: settings.id,
        event_type: "booking_click",
      });
    } catch (trackingError) {
      console.error("Failed to log booking_click", trackingError);
    }

    const target = new URL("/book", request.nextUrl.origin);
    request.nextUrl.searchParams.forEach((value, key) => {
      target.searchParams.set(key, value);
    });
    if (!target.searchParams.get("src")) {
      target.searchParams.set("src", "gmb_booking");
    }

    return NextResponse.redirect(target.toString(), { status: 302 });
  } catch (error) {
    console.error("Booking redirect failed", error);
    return NextResponse.json({ error: "Redirect failed" }, { status: 500 });
  }
}
