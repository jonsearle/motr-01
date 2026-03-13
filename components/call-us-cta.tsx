"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useOptionalBookingSettings } from "@/components/booking-settings-provider";
import { useGarageName } from "@/lib/use-garage-name";
import { resolveGarageContactNumber } from "@/lib/missed-call";

const DEFAULT_PHONE_DISPLAY = "07968777469";

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path
        d="M6.62 10.79a15.54 15.54 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.31.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.85 21 3 13.15 3 3a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.26.2 2.45.57 3.57a1 1 0 0 1-.24 1.02l-2.2 2.2Z"
      />
    </svg>
  );
}

export function CallUsCta() {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const garageName = useGarageName();
  const bookingSettings = useOptionalBookingSettings();
  const phoneDisplay = bookingSettings ? resolveGarageContactNumber(bookingSettings) || DEFAULT_PHONE_DISPLAY : DEFAULT_PHONE_DISPLAY;
  const phoneTel = `tel:${phoneDisplay.replace(/[^\d+]/g, "")}`;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    setIsMobile(mediaQuery.matches);

    const onChange = () => setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", onChange);

    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, []);

  function trackCallClick() {
    void fetch("/api/tracking/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: "call_us_click" }),
      keepalive: true,
    }).catch(() => {
      // Best-effort tracking.
    });
  }

  if (isMobile) {
    return (
      <a
        href={phoneTel}
        onClick={trackCallClick}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-600"
      >
        <PhoneIcon />
        <span>Call us</span>
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          trackCallClick();
          setDesktopOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-600"
      >
        <PhoneIcon />
        <span>Call us</span>
      </button>

      {desktopOpen && (
        <div className="fixed inset-0 z-30 bg-gray-800 px-6 pb-24 pt-8 text-white">
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
            </div>

            <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Call us</h1>
            <p className="mt-6 text-[36px] font-semibold tracking-[-0.02em]">{phoneDisplay}</p>
            <button
              type="button"
              onClick={() => setDesktopOpen(false)}
              className="mt-8 block w-full rounded-lg border border-white px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 active:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
