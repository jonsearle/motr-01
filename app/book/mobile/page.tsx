"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getGarageSiteContent, getBookingSettings, createBooking } from "@/lib/db";
import type { GarageSiteContent, BookingSettings } from "@/types/db";
import { sendBookingNotificationEmail } from "@/lib/send-booking-notification-email";

function MobilePageContent() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<GarageSiteContent | null>(null);
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [vehicleReg, setVehicleReg] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get data from previous steps
  const appointmentType = searchParams.get("appointment_type");
  const problem = searchParams.get("problem");
  const description = searchParams.get("description");
  const fromUnsure = searchParams.get("from_unsure") === "1";
  const dateParam = searchParams.get("date");

  const canSubmit = customerName.trim().length > 0 && mobile.trim().length > 0;

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

  // Auto-focus name input on mount
  useEffect(() => {
    if (nameInputRef.current && !loading) {
      nameInputRef.current.focus();
    }
  }, [loading]);

  const handleSubmit = async () => {
    if (!canSubmit || !bookingSettings || !dateParam) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Parse the selected date
      const selectedDate = new Date(dateParam);
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Get dropoff window start time for the selected date
      const dayOfWeek = getDayOfWeekName(selectedDate, bookingSettings.timezone);
      const openingDay = bookingSettings.opening_days.find(day => day.day_of_week === dayOfWeek);
      const dropoffTime = openingDay?.dropoff_from_time || null;

      // Determine appointment type and issue description
      let finalAppointmentType = appointmentType || "Custom job";
      let issueDescription: string | undefined = undefined;

      if (problem) {
        finalAppointmentType = problem;
      } else if (description) {
        // If this came from "Something else" option (from_unsure=1), set as "Customer is unsure"
        if (fromUnsure) {
          finalAppointmentType = "Customer is unsure";
          issueDescription = description;
        } else {
          // Regular custom job description
          finalAppointmentType = "Custom job";
          issueDescription = description;
        }
      }

      // Create booking
      const bookingData = {
        date: dateStr,
        time: dropoffTime || undefined,
        appointment_type: finalAppointmentType,
        issue_description: issueDescription,
        customer_name: customerName.trim(),
        customer_mobile: mobile.trim(),
        vehicle_reg: vehicleReg.trim() || undefined,
      };

      const createdBooking = await createBooking(bookingData);
      console.log("[Client] Booking created successfully:", createdBooking.id);

      // Send email notification asynchronously (fire-and-forget)
      // Don't await - booking flow continues regardless of email result
      console.log("[Client] Triggering email notification for booking:", createdBooking.id);
      
      // Call the server action and handle the promise
      const emailPromise = sendBookingNotificationEmail(createdBooking.id);
      emailPromise.then(() => {
        console.log("[Client] Email notification promise resolved");
      }).catch((error) => {
        // Error is already logged in the server action, but catch here to prevent unhandled promise rejection
        console.error("[Client] Email sending promise rejected:", error);
      });

      // Navigate to confirmation page
      router.push(`/book/confirmation?date=${dateParam}`);
    } catch (error) {
      console.error("Error creating booking:", error);
      setError(error instanceof Error ? error.message : "Failed to create booking. Please try again.");
      setSubmitting(false);
    }
  };

  // Helper function to get day of week name
  const getDayOfWeekName = (date: Date, timezone: string = 'Europe/London'): string => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
    });
    return formatter.format(date).toLowerCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error && !submitting) {
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
          <p className="text-lg font-semibold mb-2">No date selected</p>
          <p className="text-sm text-gray-400 mb-4">Please go back and select a date.</p>
          <Link
            href="/book/date-time"
            className="text-orange-500 hover:text-orange-400 underline"
          >
            Go back to select date
          </Link>
        </div>
      </div>
    );
  }

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

        {/* Title */}
        <h1 className="text-white text-2xl font-bold mb-2">Book an appointment</h1>

        {/* Subtitle */}
        <p className="text-white text-base mb-6">Enter your details</p>

        {/* Error message */}
        {error && submitting && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg">
            <p className="text-white text-sm">{error}</p>
          </div>
        )}

        {/* Form fields */}
        <div className="mb-6 space-y-4">
          {/* Name field */}
          <div>
            <input
              ref={nameInputRef}
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-gray-800 border border-white rounded-lg p-4 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={submitting}
            />
          </div>

          {/* Mobile field */}
          <div>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter mobile number to confirm..."
              className="w-full bg-gray-800 border border-white rounded-lg p-4 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={submitting}
            />
          </div>

          {/* Car Registration field */}
          <div>
            <input
              type="text"
              value={vehicleReg}
              onChange={(e) => setVehicleReg(e.target.value)}
              placeholder="Car registration (optional)"
              className="w-full bg-gray-800 border border-white rounded-lg p-4 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={submitting}
            />
          </div>
        </div>

        {/* Book now button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#FF6B35' }}
          type="button"
        >
          {submitting ? "Booking..." : "Book now"}
        </button>

        {/* Powered by Spannr footer */}
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6">
          <a
            href="https://motex-home.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white text-xs hover:text-gray-300 transition-colors"
          >
            <Image
              src="/images/spannr-icon-white.png"
              alt="Spannr"
              width={32}
              height={32}
              className="object-contain"
            />
            <span>Powered by Motr</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function MobilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <MobilePageContent />
    </Suspense>
  );
}

