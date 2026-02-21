"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useGarageName } from "@/lib/use-garage-name";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TIME_SLOTS = [
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
];

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

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
  const startDay = String(weekStart.getDate()).padStart(2, "0");
  const endDay = String(weekEnd.getDate()).padStart(2, "0");
  const startMonth = MONTH_NAMES[weekStart.getMonth()];
  const endMonth = MONTH_NAMES[weekEnd.getMonth()];
  return `${startDay} ${startMonth} to ${endDay} ${endMonth}`;
};

const formatSelectedDate = (date: Date): string => {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const toIsoDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

function DateTimeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceType = searchParams.get("service_type") || "MOT";
  const problem = searchParams.get("problem") || "";
  const description = searchParams.get("description") || "";

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const [visibleWeekStart, setVisibleWeekStart] = useState(getStartOfWeek(today));
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(TIME_SLOTS[0]);
  const garageName = useGarageName();

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(visibleWeekStart, i)),
    [visibleWeekStart]
  );

  const canNavigatePrevWeek = addDays(visibleWeekStart, -7) >= getStartOfWeek(today);

  const canContinue = !!selectedDate && !!selectedSlot;

  function handlePrevWeek() {
    if (!canNavigatePrevWeek) return;
    setVisibleWeekStart(addDays(visibleWeekStart, -7));
  }

  function handleNextWeek() {
    setVisibleWeekStart(addDays(visibleWeekStart, 7));
  }

  function handleDateClick(date: Date) {
    if (date < today) return;
    setSelectedDate(date);
    if (!selectedSlot) setSelectedSlot(TIME_SLOTS[0]);
  }

  function handleContinue() {
    if (!selectedSlot) return;

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
    <main className="min-h-screen bg-gray-800 px-6 pb-24 pt-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <Link href="/book" className="mb-6 inline-flex items-center gap-2 opacity-90">
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
            <span className="text-base font-semibold">{formatWeekRange(visibleWeekStart)}</span>
            <button onClick={handleNextWeek} className="text-white transition-colors hover:text-gray-300" type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="py-2 text-center text-xs text-white">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekDates.map((date) => {
              const isPast = date < today;
              const selected = isSameDay(date, selectedDate);
              const classes = selected
                ? "aspect-square rounded border border-white bg-white text-sm font-semibold text-gray-800"
                : isPast
                  ? "aspect-square rounded border border-gray-700 bg-gray-800 text-sm text-gray-600"
                  : "aspect-square rounded border border-white bg-gray-800 text-sm text-white hover:bg-gray-700";

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDateClick(date)}
                  disabled={isPast}
                  className={classes}
                  type="button"
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <p className="mb-2 text-base font-bold">{formatSelectedDate(selectedDate)}</p>
          <div className="flex flex-col gap-3">
            {TIME_SLOTS.map((slot) => {
              const isSelected = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`w-full rounded-lg border px-4 py-4 text-base font-medium text-center transition-colors ${
                    isSelected ? "border-white bg-white text-gray-800" : "border-white bg-gray-800 text-white hover:bg-gray-700"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full rounded-lg bg-orange-500 px-6 py-4 text-base font-bold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
        >
          Continue
        </button>
      </div>
    </main>
  );
}

export default function DateTimePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-800 p-6 text-white">Loading...</main>}>
      <DateTimeContent />
    </Suspense>
  );
}
