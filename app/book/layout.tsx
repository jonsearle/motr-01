"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PoweredByMotr } from "@/components/powered-by-motr";

const DEFAULT_GARAGE_NAME = "N1 Mobile Auto Repairs";
const DEFAULT_CALL_NUMBER = "07846799625";

function normalizePhoneForDial(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

export default function BookLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDateTimePage = pathname === "/book/date-time";
  const [loading, setLoading] = useState(true);
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [garageName, setGarageName] = useState(DEFAULT_GARAGE_NAME);
  const [callNumber, setCallNumber] = useState(DEFAULT_CALL_NUMBER);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    setIsMobile(mediaQuery.matches);

    const onChange = () => setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const response = await fetch(`/api/garage-settings?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) return;
        const settings = (await response.json()) as {
          booking_hours_enabled?: boolean;
          garage_name?: string;
          garage_phone?: string;
        };
        if (!mounted) return;

        setBookingEnabled(settings.booking_hours_enabled !== false);
        setGarageName(settings.garage_name?.trim() || DEFAULT_GARAGE_NAME);
        setCallNumber(settings.garage_phone?.trim() || DEFAULT_CALL_NUMBER);
      } catch {
        // Keep defaults.
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-800 px-6 pb-24 pt-8 text-white">
        <div className="mx-auto w-full max-w-md">
          <p className="text-sm text-gray-200">Loading...</p>
        </div>
      </main>
    );
  }

  if (!bookingEnabled) {
    const dialNumber = normalizePhoneForDial(callNumber || DEFAULT_CALL_NUMBER);

    return (
      <main className="min-h-screen bg-gray-800 px-6 pb-24 pt-8 text-white">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 inline-flex items-center gap-2 opacity-90">
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
          </div>

          <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Online booking is currently unavailable</h1>
          <p className="mt-3 text-base text-gray-200">Please call us to make a booking.</p>

          {isMobile ? (
            <a
              href={`tel:${dialNumber}`}
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-orange-500 px-6 py-4 text-base font-bold text-white transition-colors hover:bg-orange-600"
            >
              Call us
            </a>
          ) : (
            <p className="mt-6 text-3xl font-semibold tracking-[0.01em] text-white">{callNumber}</p>
          )}
        </div>
      </main>
    );
  }

  return (
    <>
      {children}
      {!isDateTimePage && (
        <PoweredByMotr
          className="fixed bottom-3 right-3 z-10"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
        />
      )}
    </>
  );
}
