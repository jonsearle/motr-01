import { NextRequest, NextResponse } from "next/server";
import { getOrCreateGarageSettings, logTrackingEvent } from "@/lib/db";
import { composeMissedCallSms, validateMissedCallCtas } from "@/lib/missed-call";
import { sendSms } from "@/lib/sms";

type MissedCallRequestData = {
  phone: string | null;
  toPhone: string | null;
  isTwilioVoiceWebhook: boolean;
};

type MissedCallResult = {
  sent: boolean;
  reason?: "auto_sms_disabled" | "invalid_cta_config";
  error?: string;
  status?: number;
};

function twimlHangupResponse(): NextResponse {
  return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Hangup/></Response>", {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

async function getRequestData(request: NextRequest): Promise<MissedCallRequestData> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
      const phone = typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null;
      return { phone, toPhone: null, isTwilioVoiceWebhook: false };
    } catch {
      return { phone: null, toPhone: null, isTwilioVoiceWebhook: false };
    }
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const candidate = form.get("phone") || form.get("From");
    const phone = typeof candidate === "string" && candidate.trim() ? candidate.trim() : null;
    const toCandidate = form.get("To");
    const toPhone = typeof toCandidate === "string" && toCandidate.trim() ? toCandidate.trim() : null;
    const isTwilioVoiceWebhook = typeof form.get("CallSid") === "string";
    return { phone, toPhone, isTwilioVoiceWebhook };
  }

  const fromQuery = request.nextUrl.searchParams.get("phone");
  return { phone: fromQuery?.trim() || null, toPhone: null, isTwilioVoiceWebhook: false };
}

async function processMissedCall(phone: string, toPhone?: string | null): Promise<MissedCallResult> {
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
    return { sent: false, reason: "auto_sms_disabled" };
  }

  const configError = validateMissedCallCtas(settings, toPhone);
  if (configError) {
    return { sent: false, reason: "invalid_cta_config", error: configError, status: 400 };
  }

  const text = composeMissedCallSms(settings, toPhone);
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

  return { sent: true };
}

export async function POST(request: NextRequest) {
  try {
    const { phone, toPhone, isTwilioVoiceWebhook } = await getRequestData(request);

    if (!phone) {
      if (isTwilioVoiceWebhook) return twimlHangupResponse();
      return NextResponse.json({ error: "phone is required" }, { status: 400 });
    }

    if (isTwilioVoiceWebhook) {
      // Process synchronously for reliability, then return immediate hangup TwiML.
      await processMissedCall(phone, toPhone);
      return twimlHangupResponse();
    }

    const result = await processMissedCall(phone, toPhone);
    if (!result.sent) {
      if (result.reason === "auto_sms_disabled") {
        return NextResponse.json({ sent: false, reason: result.reason });
      }
      if (result.reason === "invalid_cta_config") {
        return NextResponse.json(
          { sent: false, reason: result.reason, error: result.error },
          { status: result.status ?? 400 }
        );
      }
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Failed to process missed call", error);
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      return twimlHangupResponse();
    }
    return NextResponse.json({ error: "Failed to process missed call" }, { status: 500 });
  }
}
