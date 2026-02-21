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

    const target = `${request.nextUrl.origin.replace(/\/$/, "")}/book`;
    return NextResponse.redirect(target, { status: 302 });
  } catch (error) {
    console.error("Booking redirect failed", error);
    return NextResponse.json({ error: "Redirect failed" }, { status: 500 });
  }
}
