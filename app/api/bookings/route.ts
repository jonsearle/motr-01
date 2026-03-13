import { NextRequest, NextResponse } from "next/server";
import { calculateEarliestBookingDate, countBookingsByDate, parseIsoDate, toIsoDate } from "@/lib/booking-availability";
import { buildTimeSlotsForDate, normalizeOpeningHours } from "@/lib/booking-hours";
import { countBookingsOnDate, createBooking, getOrCreateGarageSettings, listBookingsByView, logTrackingEvent } from "@/lib/db";
import { getMotorHqSessionToken, MOTORHQ_AUTH_COOKIE } from "@/lib/motorhq-auth";
import { getOwnerSessionToken, OWNER_AUTH_COOKIE } from "@/lib/owner-auth";
import { buildShortLinks, isLikelyValidPhone, normalizePhoneInput } from "@/lib/missed-call";
import { sendSms } from "@/lib/sms";

const DEFAULT_OWNER_ALERT_PHONE = "07968 777469";

function validate(input: unknown): string | null {
  if (!input || typeof input !== "object") {
    return "Invalid payload";
  }

  const data = input as Record<string, unknown>;

  if (typeof data.name !== "string" || !data.name.trim()) return "Name is required";
  if (typeof data.phone !== "string" || !data.phone.trim()) return "Phone is required";
  if (!isLikelyValidPhone(data.phone)) return "Enter a valid phone number";
  if (typeof data.service_type !== "string" || !data.service_type.trim()) return "Service type is required";
  if (typeof data.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) return "Date is required";
  if (typeof data.time !== "string" || !/^\d{2}:00$/.test(data.time)) return "Time is invalid";
  if (typeof data.website === "string" && data.website.trim().length > 0) return "Invalid payload";

  return null;
}

function formatDays(value: number): string {
  return `${value} ${value === 1 ? "day" : "days"}`;
}

function formatFriendlyDate(input: string): string {
  const [year, month, day] = input.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);
  return localDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatFriendlyTime(input: string): string {
  const [hours, minutes] = input.split(":");
  const localTime = new Date(2000, 0, 1, Number(hours), Number(minutes));
  return localTime.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
}

function getOwnerAlertPhone(): string {
  const fromEnv = process.env.BOOKING_ALERT_PHONE || process.env.GARAGE_ALERT_PHONE;
  return normalizePhoneInput(fromEnv || DEFAULT_OWNER_ALERT_PHONE);
}

function mapBookingCategoryToEvent(category: string | null): "booking_completed_mot" | "booking_completed_interim_service" | "booking_completed_full_service" | "booking_completed_diagnostics" | "booking_completed_custom_job" | "booking_completed_not_sure" | null {
  if (!category) return null;

  const normalized = category.trim().toLowerCase();
  if (normalized === "mot") return "booking_completed_mot";
  if (normalized === "interim_service") return "booking_completed_interim_service";
  if (normalized === "full_service") return "booking_completed_full_service";
  if (normalized === "diagnostics" || normalized === "diagnostic") return "booking_completed_diagnostics";
  if (normalized === "custom_job") return "booking_completed_custom_job";
  if (normalized === "not_sure") return "booking_completed_not_sure";
  return null;
}

export async function GET(request: NextRequest) {
  const motorHqCookie = request.cookies.get(MOTORHQ_AUTH_COOKIE)?.value;
  const ownerCookie = request.cookies.get(OWNER_AUTH_COOKIE)?.value;
  const authorized = motorHqCookie === getMotorHqSessionToken() || ownerCookie === getOwnerSessionToken();
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const viewParam = request.nextUrl.searchParams.get("view");
    const view = viewParam === "past" || viewParam === "all" ? viewParam : "future";
    const bookings = await listBookingsByView(view);
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

    const settings = await getOrCreateGarageSettings();
    if (!settings.booking_hours_enabled) {
      return NextResponse.json({ error: "Online booking is currently unavailable." }, { status: 400 });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = parseIsoDate(body.date);
    const openingHours = normalizeOpeningHours(settings.opening_hours);
    const futureBookings = await listBookingsByView("future");
    const bookingsByDate = countBookingsByDate(futureBookings);
    const earliestAllowed = calculateEarliestBookingDate({
      today,
      minBookingNoticeDays: settings.min_booking_notice_days,
      openingHours,
      maxBookingsPerDay: settings.max_bookings_per_day,
      bookingsByDate,
    });

    if (!earliestAllowed) {
      return NextResponse.json({ error: "Online booking is currently unavailable." }, { status: 400 });
    }

    if (requestedDate < earliestAllowed) {
      return NextResponse.json(
        { error: `Please book at least ${formatDays(settings.min_booking_notice_days)} in advance.` },
        { status: 400 }
      );
    }

    const allowedSlotsForDate = buildTimeSlotsForDate(requestedDate, openingHours);
    if (!allowedSlotsForDate.includes(body.time)) {
      return NextResponse.json({ error: "Selected time is not available for that day." }, { status: 400 });
    }

    const bookingCountForDate = bookingsByDate[toIsoDate(requestedDate)] ?? (await countBookingsOnDate(body.date));
    if (bookingCountForDate >= settings.max_bookings_per_day) {
      return NextResponse.json(
        { error: `This day is fully booked. Maximum ${settings.max_bookings_per_day} online bookings per day.` },
        { status: 400 }
      );
    }

    const booking = await createBooking({
      name: body.name.trim(),
      phone: normalizePhoneInput(body.phone.trim()),
      service_type: body.service_type.trim(),
      description: typeof body.description === "string" ? body.description : undefined,
      date: body.date,
      time: body.time,
    });

    try {
      await logTrackingEvent({
        garage_id: settings.id,
        event_type: "booking_completed",
        phone_number: booking.phone,
      });

      const bookingCategoryEvent = mapBookingCategoryToEvent(
        typeof body.booking_category === "string" ? body.booking_category : null
      );
      if (bookingCategoryEvent) {
        await logTrackingEvent({
          garage_id: settings.id,
          event_type: bookingCategoryEvent,
          phone_number: booking.phone,
        });
      }
    } catch (trackingError) {
      console.error("Failed to log booking_completed", trackingError);
    }

    const links = buildShortLinks(settings.short_code);
    const callNumber = normalizePhoneInput(settings.garage_phone) || "07846799625";
    const friendlyDate = formatFriendlyDate(booking.date);
    const friendlyTime = formatFriendlyTime(booking.time);
    const garageName = settings.garage_name?.trim() || "N1 Mobile Auto Repairs";

    const message = `${garageName}:

Thanks for your booking.
We'll see you on ${friendlyDate} at ${friendlyTime}.

If you need to change your booking:

Send us a WhatsApp message:
${links.whatsapp}

Or call us on:
${callNumber}`;
    const ownerAlertMessage = `Hello, you've just got an online booking.
Check your app for more details.`;
    const ownerAlertPhone = normalizePhoneInput(settings.booking_alert_phone) || getOwnerAlertPhone();

    try {
      await sendSms(booking.phone, message);
    } catch (smsError) {
      console.error("Booking created, but confirmation SMS failed", smsError);
    }

    try {
      await sendSms(ownerAlertPhone, ownerAlertMessage);
    } catch (ownerSmsError) {
      console.error("Booking created, but owner alert SMS failed", ownerSmsError);
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Failed to create booking", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
