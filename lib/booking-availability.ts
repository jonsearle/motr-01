import { buildTimeSlotsForDate, type OpeningHours } from "@/lib/booking-hours";

export type BookingsByDate = Record<string, number>;

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function toIsoDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function parseIsoDate(input: string): Date {
  const [year, month, day] = input.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function countBookingsByDate(bookings: Array<{ date: string }>): BookingsByDate {
  return bookings.reduce<BookingsByDate>((acc, booking) => {
    acc[booking.date] = (acc[booking.date] ?? 0) + 1;
    return acc;
  }, {});
}

export function isDateAvailable(
  date: Date,
  openingHours: OpeningHours,
  maxBookingsPerDay: number,
  bookingsByDate: BookingsByDate
): boolean {
  const hasSlots = buildTimeSlotsForDate(date, openingHours).length > 0;
  if (!hasSlots) return false;

  const safeMax = Math.max(1, maxBookingsPerDay);
  return (bookingsByDate[toIsoDate(date)] ?? 0) < safeMax;
}

export function calculateEarliestBookingDate(input: {
  today: Date;
  minBookingNoticeDays: number;
  openingHours: OpeningHours;
  maxBookingsPerDay: number;
  bookingsByDate: BookingsByDate;
  searchDays?: number;
}): Date | null {
  const startDate = startOfLocalDay(input.today);
  const requiredDays = Math.max(1, input.minBookingNoticeDays);
  const searchDays = input.searchDays ?? 365;
  let openDaysRemaining = requiredDays;

  for (let offset = 1; offset <= searchDays; offset += 1) {
    const candidate = addDays(startDate, offset);
    if (!isDateAvailable(candidate, input.openingHours, input.maxBookingsPerDay, input.bookingsByDate)) {
      continue;
    }

    openDaysRemaining -= 1;
    if (openDaysRemaining === 0) {
      return candidate;
    }
  }

  return null;
}
