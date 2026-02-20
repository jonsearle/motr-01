import { NextRequest, NextResponse } from "next/server";
import { createBooking, listBookings } from "@/lib/db";
import { sendSms } from "@/lib/sms";

const ALLOWED_TIMES = new Set([
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
]);

function validate(input: unknown): string | null {
  if (!input || typeof input !== "object") {
    return "Invalid payload";
  }

  const data = input as Record<string, unknown>;

  if (typeof data.name !== "string" || !data.name.trim()) return "Name is required";
  if (typeof data.phone !== "string" || !data.phone.trim()) return "Phone is required";
  if (typeof data.service_type !== "string" || !data.service_type.trim()) return "Service type is required";
  if (typeof data.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) return "Date is required";
  if (typeof data.time !== "string" || !ALLOWED_TIMES.has(data.time)) return "Time is invalid";

  return null;
}

export async function GET() {
  try {
    const bookings = await listBookings();
    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Failed to load bookings", error);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validate(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const booking = await createBooking({
      name: body.name.trim(),
      phone: body.phone.trim(),
      service_type: body.service_type.trim(),
      description: typeof body.description === "string" ? body.description : undefined,
      date: body.date,
      time: body.time,
    });

    const message = `MOTR: Booking confirmed for ${booking.date} at ${booking.time}. We'll see you then.`;

    try {
      await sendSms(booking.phone, message);
    } catch (smsError) {
      console.error("Booking created, but confirmation SMS failed", smsError);
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Failed to create booking", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
