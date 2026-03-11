"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Booking, GarageSettings } from "@/types/db";

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

function OnlineBookingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function VehicleRegIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Zm3 4h2m2 0h2m2 0h2"
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

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 6h18M8 6V4h8v2m-7 4v7m4-7v7m-8 3h10a2 2 0 0 0 2-2V6H7v12a2 2 0 0 0 2 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BottomNav({ active }: { active: "online" | "bookings" }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 px-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }}>
      <div className="mx-auto w-full max-w-md bg-[#FBFCFE] p-1">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/"
            className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-medium transition-colors ${
              active === "online" ? "bg-[#FFEDE5] text-[#1F252E]" : "text-[#8A8F98]"
            }`}
          >
            <OnlineBookingIcon />
            <span>Website</span>
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
  const [garageName, setGarageName] = useState("N1 Mobile Auto Repairs");
  const [reviewRequestLink, setReviewRequestLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BookingTab>("future");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copyMessageInfo, setCopyMessageInfo] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/bookings?view=${activeTab}`, { cache: "no-store", signal: controller.signal });
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
      controller.abort();
    };
  }, [activeTab]);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const response = await fetch("/api/garage-settings", { cache: "no-store" });
        if (!response.ok) return;

        const settings = (await response.json()) as GarageSettings;
        if (!mounted) return;

        const nextGarageName = settings.garage_name?.trim();
        if (nextGarageName) {
          setGarageName(nextGarageName);
        }

        if (settings.short_code?.trim() && settings.google_review_url?.trim()) {
          setReviewRequestLink(`${window.location.origin}/review/${settings.short_code}`);
        } else {
          setReviewRequestLink("");
        }
      } catch {
        // Ignore and use defaults/fallbacks.
      }
    }

    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedDetails = selected ? parseBookingDetails(selected.description) : null;
  const selectedPhoneHref = selected ? `tel:${selected.phone.replace(/\s+/g, "")}` : null;

  function getFirstName(fullName: string): string {
    const first = fullName.trim().split(/\s+/)[0];
    return first || "there";
  }

  function getEmptyStateCopy(view: BookingTab): { title: string; description: string } {
    if (view === "future") {
      return {
        title: "No upcoming bookings currently",
        description: "New online bookings will appear here.",
      };
    }

    if (view === "past") {
      return {
        title: "No past bookings",
        description: "Completed bookings will appear here.",
      };
    }

    return {
      title: "You don’t have any bookings yet",
      description: "Your upcoming and past bookings will appear here.",
    };
  }

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

  function onSendReviewRequest() {
    if (!selected) return;

    if (!reviewRequestLink) {
      window.alert("Add your Google review URL in MotorHQ settings first.");
      return;
    }

    const number = selected.phone.replace(/[^\d+]/g, "");
    if (!number) {
      window.alert("Customer phone number is missing.");
      return;
    }

    const reviewLink = `${reviewRequestLink}?booking=${encodeURIComponent(selected.id)}`;
    const message = `Hi ${getFirstName(selected.name)},\n\nThanks for booking with ${garageName}.\n\nWould you mind leaving us a quick Google review?\n${reviewLink}`;
    window.location.href = `sms:${number}?body=${encodeURIComponent(message)}`;
  }

  async function onCopyGenericReviewMessage() {
    if (!reviewRequestLink) {
      window.alert("Add your Google review URL in MotorHQ settings first.");
      return;
    }

    const message = `Hi,\n\nThanks for choosing ${garageName}.\n\nIf you have a moment, we’d really appreciate a quick Google review:\n${reviewRequestLink}`;

    try {
      await navigator.clipboard.writeText(message);
      setCopyMessageInfo("Review message copied.");
      window.setTimeout(() => setCopyMessageInfo(null), 2200);
    } catch {
      window.alert("Couldn’t copy message. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] text-[#1F252E]">
      <div className="mx-auto w-full max-w-md px-6 pb-36 pt-6">
        <div className="sticky top-0 z-10 -mx-6 bg-[#FBFCFE] px-6 pb-3 pt-1">
          <header className="mb-4 flex items-center justify-between">
            <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Online Bookings</h1>
            <button
              type="button"
              onClick={onCopyGenericReviewMessage}
              aria-label="Copy review message"
              title="Copy review message"
              className="rounded-full border border-[#D7DDE6] bg-white p-2 text-[#556070] hover:bg-[#EEF2F7]"
            >
              <MessageIcon />
            </button>
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
                onClick={() => {
                  setActiveTab(key);
                  setSelected(null);
                  setConfirmDelete(false);
                }}
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

        {copyMessageInfo && <p className="mb-3 text-sm text-[#2A6A35]">{copyMessageInfo}</p>}
        {error && <p className="mb-3 text-sm text-[#7B4A40]">{error}</p>}

        {loading ? (
          <div className="space-y-3">
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-[#E4E8EF] bg-white px-4 py-6 text-center">
            <p className="text-sm font-semibold text-[#2A3341]">{getEmptyStateCopy(activeTab).title}</p>
            <p className="mt-1 text-xs text-[#6D7684]">{getEmptyStateCopy(activeTab).description}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#ECEFF4]">
            {bookings.map((booking) => {
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
                    {details.vehicleReg && (
                      <p className="flex items-center gap-2 text-sm text-[#606875]">
                        <span className="text-[#8A92A0]"><VehicleRegIcon /></span>
                        <span>{details.vehicleReg}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-2 text-sm text-[#606875]">
                      <span className="text-[#8A92A0]"><WrenchIcon /></span>
                      <span>{booking.service_type}</span>
                    </p>
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
        <div className="fixed inset-0 z-30 bg-[#FBFCFE]" role="dialog" aria-modal="true">
          <div className="mx-auto flex h-full w-full max-w-md flex-col px-6 pb-6 pt-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-[28px] font-semibold tracking-[-0.02em]">Booking Details</h3>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete booking"
                title="Delete booking"
                className="rounded-lg p-2 text-[#556070] hover:bg-[#EEF2F7]"
              >
                <TrashIcon />
              </button>
            </div>

            <div className="space-y-3 text-sm text-[#303745]">
              <p className="flex items-center gap-2 font-semibold text-[#1F252E]">
                <span className="text-[#8A92A0]"><ClockIcon /></span>
                <span>
                  {formatDate(selected.date)} {formatTime(selected.time)}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-[#8A92A0]"><UserIcon /></span>
                <span>{selected.name}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-[#8A92A0]"><PhoneIcon /></span>
                <span>{selected.phone}</span>
              </p>
              {selectedDetails?.vehicleReg && (
                <p className="flex items-center gap-2">
                  <span className="text-[#8A92A0]"><VehicleRegIcon /></span>
                  <span>{selectedDetails.vehicleReg}</span>
                </p>
              )}
              <p className="flex items-center gap-2">
                <span className="text-[#8A92A0]"><WrenchIcon /></span>
                <span>{selected.service_type}</span>
              </p>
              {selectedDetails?.note && (
                <p className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#8A92A0]"><NoteIcon /></span>
                  <span>{selectedDetails.note}</span>
                </p>
              )}
            </div>

            <div className="mt-auto space-y-2 pt-6">
              <button
                type="button"
                onClick={onSendReviewRequest}
                className="w-full rounded-xl border border-[#D7DDE6] bg-white px-4 py-3 text-sm font-semibold text-[#1F252E]"
              >
                Send Google Review Request
              </button>
              <a
                href={selectedPhoneHref ?? "#"}
                className="block w-full rounded-xl border border-[#D7DDE6] bg-white px-4 py-3 text-center text-sm font-semibold text-[#1F252E] md:hidden"
              >
                Call Customer
              </a>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setConfirmDelete(false);
                }}
                className="w-full rounded-xl bg-[#1F252E] px-4 py-3 text-sm font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && confirmDelete && (
        <div className="fixed inset-0 z-40 bg-black/35 px-6 pt-44" role="dialog" aria-modal="true">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-red-200 bg-white p-4">
            <p className="text-sm font-semibold text-[#1F252E]">Are you sure you want to delete this booking?</p>
            <p className="mt-1 text-xs text-[#6B7280]">This cannot be undone.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-[#D7DDE6] bg-white px-3 py-2 text-sm font-medium text-[#1F252E]"
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
                {deleting ? "Deleting..." : "Delete Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="bookings" />
    </main>
  );
}
