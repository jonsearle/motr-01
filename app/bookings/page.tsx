"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Booking } from "@/types/db";

type BookingTab = "future" | "past" | "all";
type BookingDetails = {
  note: string | null;
  vehicleReg: string | null;
};

function todayIso(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseBookingDetails(description: string | null): BookingDetails {
  if (!description?.trim()) {
    return { note: null, vehicleReg: null };
  }

  const parts = description
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  let vehicleReg: string | null = null;
  const noteParts: string[] = [];

  for (const part of parts) {
    const match = part.match(/^vehicle reg:\s*(.+)$/i);
    if (match && match[1]?.trim()) {
      vehicleReg = match[1].trim();
      continue;
    }
    noteParts.push(part);
  }

  return {
    note: noteParts.length > 0 ? noteParts.join(" | ") : null,
    vehicleReg,
  };
}

function SmartReplyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M1 .5h10c.28 0 .5.22.5.5v7c0 .28-.22.5-.5.5H6l-2.65 2.65a.5.5 0 01-.85-.35V8.5H1C.72 8.5.5 8.28.5 8V1C.5.72.72.5 1 .5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.87 4H6.83l1.03-1.8c.04-.11-.01-.2-.11-.2H5.72c-.1 0-.23.09-.28.2l-.96 2.58c-.05.11 0 .22.11.22h.91L4.48 7.57c-.08.2-.02.37.23.15l3.17-3.45c.17-.16.16-.27-.01-.27z"
        fill="currentColor"
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

function CarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 13h18M6 13l1.5-4h9L18 13M6 13v4m12-4v4M8 17a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 3H6a2 2 0 0 0-2 2v14l4-3h10a2 2 0 0 0 2-2V9l-6-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BookingTab>("future");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const filteredBookings = useMemo(() => {
    const today = todayIso();

    if (activeTab === "future") {
      return bookings.filter((booking) => booking.date >= today);
    }

    if (activeTab === "past") {
      return bookings.filter((booking) => booking.date < today);
    }

    return bookings;
  }, [bookings, activeTab]);
  const selectedDetails = selected ? parseBookingDetails(selected.description) : null;

  async function onDeleteBooking() {
    if (!selected) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${selected.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("delete_failed");

      setBookings((current) => current.filter((b) => b.id !== selected.id));
      setSelected(null);
      setConfirmDelete(false);
    } catch {
      setError("Couldn’t delete booking.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] text-[#1F252E]">
      <div className="mx-auto w-full max-w-md px-6 pb-36 pt-6">
        <div className="sticky top-0 z-10 -mx-6 bg-[#FBFCFE] px-6 pb-3 pt-1">
          <header className="mb-4 flex items-center justify-between">
            <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Online Bookings</h1>
            <Link
              href="/account?from=bookings"
              aria-label="Account"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#EEF1F5] bg-[#F8FAFC] text-[#A1A8B3]"
            >
              <AccountIcon />
            </Link>
          </header>

          <div className="grid grid-cols-3 gap-2">
            {([
              ["future", "Future"],
              ["past", "Past"],
              ["all", "All"],
            ] as Array<[BookingTab, string]>).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`h-10 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === key
                    ? "bg-transparent text-[#1F252E] ring-1 ring-[#DCE1E8]"
                    : "bg-transparent text-[#8D94A0]"
                }`}
              >
                {key === "future" ? "Upcoming" : label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3" />

        {error && <p className="mb-3 text-sm text-[#7B4A40]">{error}</p>}

        {loading ? (
          <div className="space-y-3">
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <p className="py-6 text-sm text-[#737A85]">No bookings in this view.</p>
        ) : (
          <div className="divide-y divide-[#ECEFF4]">
            {filteredBookings.map((booking) => {
              const details = parseBookingDetails(booking.description);

              return (
                <button
                  type="button"
                  key={booking.id}
                  onClick={() => {
                    setSelected(booking);
                    setConfirmDelete(false);
                  }}
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
                    {details.vehicleReg && (
                      <p className="flex items-start gap-2 text-sm text-[#606875]">
                        <span className="mt-0.5 text-[#8A92A0]"><CarIcon /></span>
                        <span>{details.vehicleReg}</span>
                      </p>
                    )}
                    {details.note && (
                      <p className="flex items-start gap-2 text-sm text-[#606875]">
                        <span className="mt-0.5 text-[#8A92A0]"><NoteIcon /></span>
                        <span>{details.note}</span>
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-30 bg-black/35 px-4 pb-6 pt-20" role="dialog" aria-modal="true">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-[#E8EBF0] bg-white p-5">
            <h3 className="text-lg font-semibold">Booking Details</h3>

            <div className="mt-4 space-y-2 text-sm text-[#303745]">
              <p><strong>Name:</strong> {selected.name}</p>
              <p><strong>Phone:</strong> {selected.phone}</p>
              <p><strong>Date:</strong> {formatDate(selected.date)}</p>
              <p><strong>Time:</strong> {formatTime(selected.time)}</p>
              <p><strong>Service Type:</strong> {selected.service_type}</p>
              {selectedDetails?.vehicleReg && <p><strong>Vehicle Reg:</strong> {selectedDetails.vehicleReg}</p>}
              {selectedDetails?.note && <p><strong>Note:</strong> {selectedDetails.note}</p>}
              <p><strong>Created:</strong> {formatCreatedAt(selected.created_at)}</p>
            </div>

            {!confirmDelete ? (
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                >
                  Delete Booking
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="w-full rounded-xl bg-[#1F252E] px-4 py-3 text-sm font-semibold text-white"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">Delete this booking?</p>
                <p className="mt-1 text-xs text-red-600">This cannot be undone.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-[#1F252E]"
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onDeleteBooking}
                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav active="bookings" />
    </main>
  );
}
