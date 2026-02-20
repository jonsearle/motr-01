import { NextRequest, NextResponse } from "next/server";
import { getOrCreateGarageSettings } from "@/lib/db";
import { bookingLink, sendSms } from "@/lib/sms";

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

    if (!settings.auto_sms_enabled) {
      return NextResponse.json({ sent: false, reason: "auto_sms_disabled" });
    }

    const text = `MOTR: Sorry we missed your call. Book here: ${bookingLink()}`;
    await sendSms(phone, text);

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Failed to process missed call", error);
    const message = error instanceof Error ? error.message : "Failed to process missed call";
    return NextResponse.json({ error: "Failed to process missed call", detail: message }, { status: 500 });
  }
}
