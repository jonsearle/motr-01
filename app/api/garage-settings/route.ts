import { NextRequest, NextResponse } from "next/server";
import { getOrCreateGarageSettings, updateGarageSettings } from "@/lib/db";
import { getMotorHqSessionToken, MOTORHQ_AUTH_COOKIE } from "@/lib/motorhq-auth";
import { getOwnerSessionToken, OWNER_AUTH_COOKIE } from "@/lib/owner-auth";
import { normalizePhoneInput } from "@/lib/missed-call";
import type { UpdateGarageSettingsInput } from "@/types/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getOrCreateGarageSettings();
    return NextResponse.json(settings, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Failed to load garage settings", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const motorHqCookie = request.cookies.get(MOTORHQ_AUTH_COOKIE)?.value;
  const ownerCookie = request.cookies.get(OWNER_AUTH_COOKIE)?.value;
  const authorized = motorHqCookie === getMotorHqSessionToken() || ownerCookie === getOwnerSessionToken();
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as UpdateGarageSettingsInput;
    const updateInput: UpdateGarageSettingsInput = {};

    if (typeof body.auto_sms_enabled === "boolean") updateInput.auto_sms_enabled = body.auto_sms_enabled;
    if (typeof body.garage_name === "string") updateInput.garage_name = body.garage_name;
    if (typeof body.cta_booking_enabled === "boolean") updateInput.cta_booking_enabled = body.cta_booking_enabled;
    if (typeof body.cta_whatsapp_enabled === "boolean") updateInput.cta_whatsapp_enabled = body.cta_whatsapp_enabled;
    if (typeof body.cta_phone_enabled === "boolean") updateInput.cta_phone_enabled = body.cta_phone_enabled;
    if (typeof body.whatsapp_number === "string") {
      updateInput.whatsapp_number = normalizePhoneInput(body.whatsapp_number);
    }
    if (typeof body.garage_phone === "string") {
      updateInput.garage_phone = normalizePhoneInput(body.garage_phone);
    }
    if (typeof body.booking_alert_phone === "string") {
      updateInput.booking_alert_phone = normalizePhoneInput(body.booking_alert_phone);
    }
    if (typeof body.google_review_url === "string") {
      updateInput.google_review_url = body.google_review_url.trim();
    }
    if (typeof body.min_booking_notice_days === "number") {
      updateInput.min_booking_notice_days = body.min_booking_notice_days;
    }
    if (typeof body.max_bookings_per_day === "number") {
      updateInput.max_bookings_per_day = body.max_bookings_per_day;
    }
    if (typeof body.booking_hours_enabled === "boolean") {
      updateInput.booking_hours_enabled = body.booking_hours_enabled;
    }
    if (body.opening_hours && typeof body.opening_hours === "object") {
      updateInput.opening_hours = body.opening_hours as UpdateGarageSettingsInput["opening_hours"];
    }

    if (Object.keys(updateInput).length === 0) {
      return NextResponse.json({ error: "No valid settings fields provided" }, { status: 400 });
    }

    const updated = await updateGarageSettings(updateInput);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Failed to update garage settings", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
