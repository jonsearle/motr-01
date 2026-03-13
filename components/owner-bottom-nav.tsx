"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function OnlineBookingIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 14a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 14"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 10a5 5 0 0 1 0 7L12.5 18.5a5 5 0 1 1-7-7L7 10"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 3v4M17 3v4M4 9h16M6 6h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function OwnerBottomNav({ active }: { active: "online" | "bookings" }) {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/bookings");
  }, [router]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 px-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}>
      <div className="mx-auto w-full max-w-md bg-[#FBFCFE] px-1 py-2">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/"
            prefetch
            className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-medium transition-colors ${
              active === "online" ? "bg-[#FFEDE5] text-[#1F252E]" : "text-[#8A8F98]"
            }`}
          >
            <OnlineBookingIcon />
            <span>Website</span>
          </Link>
          <Link
            href="/bookings"
            prefetch
            className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-medium transition-colors ${
              active === "bookings" ? "bg-[#FFEDE5] text-[#1F252E]" : "text-[#8A8F98]"
            }`}
          >
            <CalendarIcon />
            <span>Bookings</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
