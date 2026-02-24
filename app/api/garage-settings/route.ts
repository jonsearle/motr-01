import { NextRequest, NextResponse } from "next/server";
import { getOrCreateGarageSettings, updateGarageSettings } from "@/lib/db";
import { normalizePhoneInput } from "@/lib/missed-call";
import type { UpdateGarageSettingsInput } from "@/types/db";

export async function GET() {
  try {
    const settings = await getOrCreateGarageSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to load garage settings", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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
    if (typeof body.min_booking_notice_days === "number") {
      updateInput.min_booking_notice_days = body.min_booking_notice_days;
    }
    if (typeof body.max_bookings_per_day === "number") {
      updateInput.max_bookings_per_day = body.max_bookings_per_day;
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
    console.error("Failed to update garage settings", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
