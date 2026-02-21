import { NextRequest, NextResponse } from "next/server";
import { getGarageSettingsByShortCode, logTrackingEvent } from "@/lib/db";
import { buildWhatsappDestination, normalizeWhatsappNumber } from "@/lib/missed-call";

export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params;

  try {
    const settings = await getGarageSettingsByShortCode(code);
    if (!settings) {
      return NextResponse.json({ error: "Unknown WhatsApp link" }, { status: 404 });
    }

    const number = normalizeWhatsappNumber(settings.whatsapp_number);
    if (!number) {
      return NextResponse.json({ error: "WhatsApp number missing" }, { status: 400 });
    }

    try {
      await logTrackingEvent({
        garage_id: settings.id,
        event_type: "whatsapp_click",
      });
    } catch (trackingError) {
      console.error("Failed to log whatsapp_click", trackingError);
    }

    return NextResponse.redirect(buildWhatsappDestination(number), { status: 302 });
  } catch (error) {
    console.error("WhatsApp redirect failed", error);
    return NextResponse.json({ error: "Redirect failed" }, { status: 500 });
  }
}
