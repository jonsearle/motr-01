"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getGarageSiteContent, getBookingSettings } from "@/lib/db";
import type { GarageSiteContent, BookingSettings, OpeningDay } from "@/types/db";

const DAYS_OF_WEEK_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function ConfirmationPageContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<GarageSiteContent | null>(null);
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null);
  const searchParams = useSearchParams();

  const dateParam = searchParams.get("date");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setError(null);
        console.log("Loading garage content and booking settings...");

        const [contentData, settingsData] = await Promise.all([
          getGarageSiteContent(),
          getBookingSettings(),
        ]);

        if (!isMounted) return;

        setContent(contentData);
        setBookingSettings(settingsData);
      } catch (error) {
        if (!isMounted) return;
        const errorMessage = error instanceof Error ? error.message : "Failed to load garage information";
        setError(errorMessage);
        console.error("Error loading garage data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Get day of week name from a date in garage timezone
  const getDayOfWeekName = (date: Date, timezone: string = 'Europe/London'): OpeningDay['day_of_week'] => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
    });
    const dayName = formatter.format(date).toLowerCase();
    return dayName as OpeningDay['day_of_week'];
  };

  // Format date as "DayName Day Month" (e.g., "Friday 10 September")
  const formatBookingDate = (date: Date): string => {
    const dayName = DAYS_OF_WEEK_FULL[date.getDay()];
    const day = date.getDate();
    const monthName = MONTH_NAMES[date.getMonth()];
    return `${dayName} ${day} ${monthName}`;
  };

  // Get drop-off times for the booking date
  const getDropoffTimes = (date: Date, settings: BookingSettings | null): { from: string; to: string } | null => {
    if (!settings) return null;
    
    const dayOfWeek = getDayOfWeekName(date, settings.timezone);
    const openingDay = settings.opening_days.find(day => day.day_of_week === dayOfWeek);
    
    if (!openingDay || !openingDay.is_open) return null;
    if (!openingDay.dropoff_from_time || !openingDay.dropoff_to_time) return null;
    
    return {
      from: openingDay.dropoff_from_time,
      to: openingDay.dropoff_to_time,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center p-6">
        <div className="text-white text-center">
          <p className="text-lg font-semibold mb-2">Error loading garage information</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!dateParam) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center p-6">
        <div className="text-white text-center">
          <p className="text-lg font-semibold mb-2">No booking date found</p>
          <p className="text-sm text-gray-400 mb-4">Please go back and try again.</p>
          <Link
            href="/book"
            className="text-orange-500 hover:text-orange-400 underline"
          >
            Go back to booking
          </Link>
        </div>
      </div>
    );
  }

  const bookingDate = new Date(dateParam);
  const formattedDate = formatBookingDate(bookingDate);
  const dropoffTimes = getDropoffTimes(bookingDate, bookingSettings);
  const businessName = content?.business_name || "Garage";

  return (
    <div className="min-h-screen bg-gray-800 flex items-start justify-center pt-8 px-6 pb-20 md:pb-24">
      <div className="w-full max-w-md">
        {/* Header with garage name */}
        <Link 
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            <path
              d="M5 11L6.5 6.5H17.5L19 11M5 11H3V18H5V11ZM19 11H21V18H19V11ZM5 11V18H19V11M7.5 14H9.5M14.5 14H16.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-white font-bold text-base">{businessName}</span>
        </Link>

        {/* Checkmark icon */}
        <div className="flex mb-6">
          <div className="w-[60px] h-[60px] rounded-full border-2 border-white flex items-center justify-center">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Main heading */}
        <h1 className="text-white text-2xl font-bold mb-2">Booking confirmed</h1>

        {/* Thanks message */}
        <p className="text-white text-base mb-6">Thanks for booking.</p>

        {/* Booking details */}
        {dropoffTimes ? (
          <p className="text-white text-base mb-6">
            We've sent you a confirmation text and will see between{" "}
            <span className="font-bold">{dropoffTimes.from}</span> and{" "}
            <span className="font-bold">{dropoffTimes.to}</span> on{" "}
            <span className="font-bold">{formattedDate}</span>.
          </p>
        ) : (
          <p className="text-white text-base mb-6">
            We've sent you a confirmation text and will see you on{" "}
            <span className="font-bold">{formattedDate}</span>.
          </p>
        )}

        {/* Powered by Spannr footer */}
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6">
          <a
            href="https://bbc.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white text-xs hover:text-gray-300 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path
                d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Powered by Spannr</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ConfirmationPageContent />
    </Suspense>
  );
}

