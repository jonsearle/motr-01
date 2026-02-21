import { NextRequest, NextResponse } from "next/server";
import { getOrCreateGarageSettings, logTrackingEvent } from "@/lib/db";
import { composeMissedCallSms, validateMissedCallCtas } from "@/lib/missed-call";
import { sendSms } from "@/lib/sms";

async function getPhoneFromRequest(request: NextRequest): Promise<string | null> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
      return typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null;
    } catch {
      return null;
    }
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const candidate = form.get("phone") || form.get("From");
    return typeof candidate === "string" && candidate.trim() ? candidate.trim() : null;
  }

  const fromQuery = request.nextUrl.searchParams.get("phone");
  return fromQuery?.trim() || null;
}

export async function POST(request: NextRequest) {
  try {
    const phone = await getPhoneFromRequest(request);

    if (!phone) {
      return NextResponse.json({ error: "phone is required" }, { status: 400 });
    }

    const settings = await getOrCreateGarageSettings();
    try {
      await logTrackingEvent({
        garage_id: settings.id,
        event_type: "missed_call",
        phone_number: phone,
      });
    } catch (trackingError) {
      console.error("Failed to log missed_call", trackingError);
    }

    if (!settings.auto_sms_enabled) {
      return NextResponse.json({ sent: false, reason: "auto_sms_disabled" });
    }

    const configError = validateMissedCallCtas(settings);
    if (configError) {
      return NextResponse.json({ sent: false, reason: "invalid_cta_config", error: configError }, { status: 400 });
    }

    const text = composeMissedCallSms(settings);
    await sendSms(phone, text);
    try {
      await logTrackingEvent({
        garage_id: settings.id,
        event_type: "sms_sent",
        phone_number: phone,
      });
    } catch (trackingError) {
      console.error("Failed to log sms_sent", trackingError);
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Failed to process missed call", error);
    return NextResponse.json({ error: "Failed to process missed call" }, { status: 500 });
  }
}
