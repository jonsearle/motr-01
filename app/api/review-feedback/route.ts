import { NextRequest, NextResponse } from "next/server";
import { createReviewFeedback, getBookingById, getGarageSettingsByShortCode, getOrCreateGarageSettings, listReviewFeedback } from "@/lib/db";
import { getMotorHqSessionToken, MOTORHQ_AUTH_COOKIE } from "@/lib/motorhq-auth";

export const dynamic = "force-dynamic";

type ParsedBookingDetails = {
  vehicleReg: string | null;
  note: string | null;
};

function parseBookingDetails(description: string | null): ParsedBookingDetails {
  if (!description?.trim()) {
    return { vehicleReg: null, note: null };
  }

  const parts = description
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  let vehicleReg: string | null = null;
  const noteParts: string[] = [];

  for (const part of parts) {
    const match = part.match(/^vehicle reg:\s*(.+)$/i);
    if (match && match[1]?.trim()) {
      vehicleReg = match[1].trim();
      continue;
    }
    noteParts.push(part);
  }

  return {
    vehicleReg,
    note: noteParts.length > 0 ? noteParts.join(" | ") : null,
  };
}

export async function GET(request: NextRequest) {
  const authCookie = request.cookies.get(MOTORHQ_AUTH_COOKIE)?.value;
  if (authCookie !== getMotorHqSessionToken()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getOrCreateGarageSettings();
    const feedback = await listReviewFeedback(settings.id);
    return NextResponse.json(feedback);
  } catch {
    return NextResponse.json({ error: "Failed to load feedback" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      short_code?: string;
      rating?: number;
      message?: string;
      customer_phone?: string;
      booking_id?: string;
    };

    const shortCode = body.short_code?.trim().toLowerCase();
    const rating = body.rating;
    const message = body.message?.trim() ?? "";
    const bookingId = body.booking_id?.trim() || null;

    if (!shortCode) {
      return NextResponse.json({ error: "Short code is required" }, { status: 400 });
    }
    if (!Number.isInteger(rating) || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1 to 5" }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "Feedback message is required" }, { status: 400 });
    }

    const settings = await getGarageSettingsByShortCode(shortCode);
    if (!settings) {
      return NextResponse.json({ error: "Garage not found" }, { status: 404 });
    }

    let customerName: string | null = null;
    let vehicleReg: string | null = null;
    let bookingNote: string | null = null;

    if (bookingId) {
      const booking = await getBookingById(bookingId);
      if (booking) {
        customerName = booking.name;
        const details = parseBookingDetails(booking.description);
        vehicleReg = details.vehicleReg;
        bookingNote = details.note;
      }
    }

    await createReviewFeedback({
      garage_id: settings.id,
      rating,
      message,
      customer_phone: body.customer_phone?.trim() || null,
      booking_id: bookingId,
      customer_name: customerName,
      vehicle_reg: vehicleReg,
      booking_note: bookingNote,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
