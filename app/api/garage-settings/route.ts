import { NextRequest, NextResponse } from "next/server";
import { getOrCreateGarageSettings, setAutoSmsEnabled } from "@/lib/db";

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
    const body = await request.json();
    if (typeof body.auto_sms_enabled !== "boolean") {
      return NextResponse.json(
        { error: "auto_sms_enabled must be a boolean" },
        { status: 400 }
      );
    }

    const updated = await setAutoSmsEnabled(body.auto_sms_enabled);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update garage settings", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
