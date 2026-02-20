"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Booking } from "@/types/db";

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  return `${weekday} ${day} ${month}`;
}

function formatTime(value: string): string {
  return value.slice(0, 5);
}

function formatCreatedAt(value: string): string {
  return new Date(value).toLocaleString();
}

function SmartReplyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12a7 7 0 0 1 7-7h2a7 7 0 1 1 0 14h-2l-4 3v-6a7 7 0 0 1-3-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m13 8-2.2 3h2l-1.6 5 4.8-6h-2L16 8h-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
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

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 19a6 6 0 1 0-12 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 16.92V20a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.1 2h3.1a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8 9.83a16 16 0 0 0 6.17 6.17l1.38-1.38a2 2 0 0 1 2.1-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BottomNav({ active }: { active: "smart" | "bookings" }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 px-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }}>
      <div className="mx-auto w-full max-w-md bg-[#FBFCFE] p-1">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/"
            className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-medium transition-colors ${
              active === "smart" ? "bg-[#FFEDE5] text-[#1F252E]" : "text-[#8A8F98]"
            }`}
          >
            <SmartReplyIcon />
            <span>Smart Reply</span>
          </Link>
          <Link
            href="/bookings"
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

function AccountIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/bookings", { cache: "no-store" });
        if (!response.ok) throw new Error("load_failed");

        const data: Booking[] = await response.json();
        if (!mounted) return;
        setBookings(data);
      } catch {
        if (!mounted) return;
        setError("Couldn’t load bookings.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#FBFCFE] text-[#1F252E]">
      <div className="mx-auto w-full max-w-md px-6 pb-36 pt-6">
        <header className="mb-5 flex items-center justify-between">
          <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Bookings</h1>
          <button
            type="button"
            aria-label="Account"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#EEF1F5] bg-[#F8FAFC] text-[#A1A8B3]"
          >
            <AccountIcon />
          </button>
        </header>

        {error && <p className="mb-3 text-sm text-[#7B4A40]">{error}</p>}

        {loading ? (
          <div className="space-y-3">
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
          </div>
        ) : bookings.length === 0 ? (
          <p className="py-6 text-sm text-[#737A85]">No bookings yet.</p>
        ) : (
          <div className="divide-y divide-[#ECEFF4]">
            {bookings.map((booking) => (
              <button
                type="button"
                key={booking.id}
                onClick={() => setSelected(booking)}
                className="w-full py-4 text-left transition-colors hover:bg-[#F7F9FC]"
              >
                <div className="space-y-1.5">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <span className="text-[#8A92A0]"><ClockIcon /></span>
                    <span>
                      {formatDate(booking.date)} {formatTime(booking.time)}
                    </span>
                  </p>
                  <p className="flex items-center gap-2 text-sm text-[#303745]">
                    <span className="text-[#8A92A0]"><UserIcon /></span>
                    <span>{booking.name}</span>
                  </p>
                  <p className="flex items-center gap-2 text-sm text-[#606875]">
                    <span className="text-[#8A92A0]"><PhoneIcon /></span>
                    <span>{booking.phone}</span>
                  </p>
                  <p className="flex items-center gap-2 text-sm text-[#606875]">
                    <span className="text-[#8A92A0]"><WrenchIcon /></span>
                    <span>{booking.service_type}</span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-30 bg-black/35 px-4 pb-6 pt-20" role="dialog" aria-modal="true">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-[#E8EBF0] bg-white p-5">
            <h3 className="text-lg font-semibold">Booking Details</h3>
            <div className="mt-4 space-y-2 text-sm">
              <p><strong>Name:</strong> {selected.name}</p>
              <p><strong>Phone:</strong> {selected.phone}</p>
              <p><strong>Date:</strong> {formatDate(selected.date)}</p>
              <p><strong>Time:</strong> {formatTime(selected.time)}</p>
              <p><strong>Service Type:</strong> {selected.service_type}</p>
              {selected.description && <p><strong>Description:</strong> {selected.description}</p>}
              <p><strong>Created:</strong> {formatCreatedAt(selected.created_at)}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-5 w-full rounded-xl bg-[#1F252E] px-4 py-3 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <BottomNav active="bookings" />
    </main>
  );
}
