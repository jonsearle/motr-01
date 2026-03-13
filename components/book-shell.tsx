"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PoweredByMotr } from "@/components/powered-by-motr";
import { useBookingSettings } from "@/components/booking-settings-provider";

export function BookingUnavailable({
  garageName,
  callNumber,
}: {
  garageName: string;
  callNumber: string;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    setIsMobile(mediaQuery.matches);

    const onChange = () => setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  const dialNumber = callNumber.replace(/[^\d+]/g, "");

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

export function BookShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDateTimePage = pathname === "/book/date-time";
  const settings = useBookingSettings();

  useEffect(() => {
    document.title = settings.garage_name?.trim() || "N1 Mobile Auto Repairs";
  }, [settings.garage_name]);

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
