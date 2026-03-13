"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CallUsCta } from "@/components/call-us-cta";
import { PoweredByMotr } from "@/components/powered-by-motr";
import { useBookingSettings } from "@/components/booking-settings-provider";
import { calculateEarliestBookingDate, addDays, isDateAvailable, toIsoDate, type BookingsByDate } from "@/lib/booking-availability";
import { buildTimeSlotsForDate, normalizeOpeningHours } from "@/lib/booking-hours";
import { useTrackPageView } from "@/lib/use-track-page-view";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CALL_NUMBER = "07846799625";

const getStartOfWeek = (date: Date): Date => {
  const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = weekStart.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + offset);
  return weekStart;
};

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatWeekRange = (weekStart: Date): string => {
  const weekEnd = addDays(weekStart, 6);
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const startMonth = MONTH_NAMES[weekStart.getMonth()];
  const endMonth = MONTH_NAMES[weekEnd.getMonth()];
  return `${startDay} ${startMonth} to ${endDay} ${endMonth}`;
};

export function BookDateTimeClient({ initialBookingsByDate }: { initialBookingsByDate: BookingsByDate }) {
  useTrackPageView("page_view_date_time");

  const searchParams = useSearchParams();
  const router = useRouter();
  const settings = useBookingSettings();
  const serviceType = searchParams.get("service_type") || "MOT";
  const problem = searchParams.get("problem") || "";
  const description = searchParams.get("description") || "";

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const minBookingNoticeDays = settings.min_booking_notice_days;
  const maxBookingsPerDay = settings.max_bookings_per_day;
  const bookingHoursEnabled = settings.booking_hours_enabled;
  const openingHours = useMemo(() => normalizeOpeningHours(settings.opening_hours), [settings.opening_hours]);
  const garageName = settings.garage_name?.trim() || "N1 Mobile Auto Repairs";

  const [bookingsByDate] = useState<BookingsByDate>(initialBookingsByDate);
  const [navigating, setNavigating] = useState(false);

  const firstAvailableDate = useMemo(() => {
    return (
      calculateEarliestBookingDate({
        today,
        minBookingNoticeDays,
        openingHours,
        maxBookingsPerDay,
        bookingsByDate,
      }) ?? today
    );
  }, [today, minBookingNoticeDays, openingHours, maxBookingsPerDay, bookingsByDate]);
  const firstAvailableWeekStart = useMemo(() => getStartOfWeek(firstAvailableDate), [firstAvailableDate]);

  const [visibleWeekStart, setVisibleWeekStart] = useState(getStartOfWeek(firstAvailableDate));
  const [selectedDate, setSelectedDate] = useState<Date>(firstAvailableDate);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(visibleWeekStart, index)),
    [visibleWeekStart]
  );

  const selectedDateSlots = useMemo(() => {
    const selectedDateIso = toIsoDate(selectedDate);
    const selectedIsFull = (bookingsByDate[selectedDateIso] ?? 0) >= Math.max(1, maxBookingsPerDay);
    if (selectedIsFull) return [];
    return buildTimeSlotsForDate(selectedDate, openingHours);
  }, [selectedDate, openingHours, bookingsByDate, maxBookingsPerDay]);

  const canNavigatePrevWeek = addDays(visibleWeekStart, -7) >= firstAvailableWeekStart;
  const canContinue = bookingHoursEnabled && !!selectedDate && !!selectedSlot && !navigating;

  useEffect(() => {
    setSelectedDate(firstAvailableDate);
    setVisibleWeekStart(getStartOfWeek(firstAvailableDate));
  }, [firstAvailableDate]);

  useEffect(() => {
    const nextFirstAvailableDate =
      calculateEarliestBookingDate({
        today,
        minBookingNoticeDays,
        openingHours,
        maxBookingsPerDay,
        bookingsByDate,
      }) ?? firstAvailableDate;
    const earliestWeekStart = getStartOfWeek(nextFirstAvailableDate);
    const selectedIsAvailable = isDateAvailable(selectedDate, openingHours, maxBookingsPerDay, bookingsByDate);

    if (selectedDate < nextFirstAvailableDate || !selectedIsAvailable) {
      setSelectedDate(nextFirstAvailableDate);
    }

    if (visibleWeekStart < earliestWeekStart) {
      setVisibleWeekStart(earliestWeekStart);
    }
  }, [
    today,
    minBookingNoticeDays,
    firstAvailableDate,
    selectedDate,
    visibleWeekStart,
    openingHours,
    maxBookingsPerDay,
    bookingsByDate,
  ]);

  useEffect(() => {
    if (!selectedDateSlots.length) {
      setSelectedSlot(null);
      return;
    }

    if (!selectedSlot || !selectedDateSlots.includes(selectedSlot)) {
      setSelectedSlot(selectedDateSlots[0]);
    }
  }, [selectedDateSlots, selectedSlot]);

  function handlePrevWeek() {
    if (!canNavigatePrevWeek) return;
    setVisibleWeekStart(addDays(visibleWeekStart, -7));
  }

  function handleNextWeek() {
    setVisibleWeekStart(addDays(visibleWeekStart, 7));
  }

  function handleDateClick(date: Date) {
    if (date < firstAvailableDate || !isDateAvailable(date, openingHours, maxBookingsPerDay, bookingsByDate)) return;
    setSelectedDate(date);
  }

  function handleContinue() {
    if (!selectedSlot || !bookingHoursEnabled || navigating) return;
    setNavigating(true);

    const params = new URLSearchParams({
      service_type: serviceType,
      date: toIsoDate(selectedDate),
      time: selectedSlot,
    });
    if (description.trim()) {
      params.set("description", description.trim());
    }
    if (problem.trim()) {
      params.set("problem", problem.trim());
    }

    router.push(`/book/mobile?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-gray-800 px-6 pb-36 pt-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/book" className="inline-flex items-center gap-2 opacity-90">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-white">
              <path
                d="M5 11L6.5 6.5H17.5L19 11M5 11H3V18H5V11ZM19 11H21V18H19V11ZM5 11V18H19V11M7.5 14H9.5M14.5 14H16.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-base font-bold">{garageName}</span>
          </Link>
          {bookingHoursEnabled ? (
            <CallUsCta />
          ) : (
            <a
              href={`tel:${CALL_NUMBER}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-600"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M6.62 10.79a15.54 15.54 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.31.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.85 21 3 13.15 3 3a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.26.2 2.45.57 3.57a1 1 0 0 1-.24 1.02l-2.2 2.2Z" />
              </svg>
              <span>Call us</span>
            </a>
          )}
        </div>

        {!bookingHoursEnabled ? (
          <div className="mt-4">
            <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Online booking is currently unavailable</h1>
            <p className="mt-3 text-base text-gray-200">Please call us to make a booking.</p>
            <a
              href={`tel:${CALL_NUMBER}`}
              className="mt-6 block w-full rounded-lg border border-white bg-gray-800 px-4 py-4 text-center text-xl font-semibold tracking-[0.01em] text-white transition-colors hover:bg-gray-700"
            >
              {CALL_NUMBER}
            </a>
          </div>
        ) : (
          <>
            <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Book an appointment</h1>
            <p className="mb-6 mt-2 text-base">When would you like to come in?</p>

            <div className="mb-6">
              <div className="mb-4 flex items-center justify-end gap-2">
                <button
                  onClick={handlePrevWeek}
                  className="text-white transition-colors hover:text-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                  type="button"
                  disabled={!canNavigatePrevWeek}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <span className="text-base text-gray-100">{formatWeekRange(visibleWeekStart)}</span>
                <button
                  onClick={handleNextWeek}
                  className="text-white transition-colors hover:text-gray-300"
                  type="button"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {weekDates.map((date) => {
                  const isBeforeNotice = date < firstAvailableDate;
                  const slotsForDay = buildTimeSlotsForDate(date, openingHours);
                  const isClosed = slotsForDay.length === 0;
                  const isFull = !isClosed && !isDateAvailable(date, openingHours, maxBookingsPerDay, bookingsByDate);
                  const isSelected = isSameDay(date, selectedDate);
                  const isDisabled = isBeforeNotice || isClosed || isFull;

                  const classes = isSelected
                    ? "h-14 w-full rounded-xl border border-white bg-white text-gray-900"
                    : isDisabled
                      ? "h-14 w-full rounded-xl border border-gray-600 bg-gray-700 text-gray-500"
                      : "h-14 w-full rounded-xl border border-white bg-gray-800 text-white hover:bg-gray-700";

                  return (
                    <div key={date.toISOString()} className="flex flex-col items-center gap-1.5">
                      <span className={`text-sm leading-none ${isDisabled ? "text-gray-500" : "text-gray-100"}`}>
                        {DAYS_OF_WEEK[date.getDay()]}
                      </span>
                      <button
                        onClick={() => handleDateClick(date)}
                        disabled={isDisabled}
                        className={`${classes} flex items-center justify-center text-xl font-semibold leading-none transition-colors disabled:cursor-not-allowed`}
                        type="button"
                      >
                        {date.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-8 mt-2">
              <p className="mb-5 text-base text-gray-200">Pick a time</p>
              <div className="flex flex-col gap-3">
                {selectedDateSlots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`w-full rounded-lg border px-4 py-4 text-center text-base font-medium transition-colors ${
                        isSelected ? "border-white bg-white text-gray-800" : "border-white bg-gray-800 text-white hover:bg-gray-700"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {bookingHoursEnabled && (
        <div
          className="sticky bottom-0 left-0 right-0 mx-auto w-full max-w-md bg-gradient-to-t from-gray-800 via-gray-800 to-transparent pt-4"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
        >
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="w-full rounded-lg bg-orange-500 px-6 py-4 text-base font-bold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
          >
            {navigating ? "Loading..." : "Continue"}
          </button>
          <div className="mt-2 flex justify-end">
            <PoweredByMotr />
          </div>
        </div>
      )}
    </main>
  );
}
