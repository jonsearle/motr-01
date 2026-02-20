"use client";

import { useEffect, useState } from "react";
import type { Booking, GarageSettings } from "@/types/db";

type Tab = "capture" | "bookings";
const REQUEST_TIMEOUT_MS = 8000;

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function formatTime(value: string): string {
  return value.slice(0, 5);
}

function formatCreatedAt(value: string): string {
  return new Date(value).toLocaleString();
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed: ${url}`);
    }
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("capture");
  const [settings, setSettings] = useState<GarageSettings | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggleSaving, setToggleSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [settingsResult, bookingsResult] = await Promise.allSettled([
          fetchJsonWithTimeout<GarageSettings>("/api/garage-settings"),
          fetchJsonWithTimeout<Booking[]>("/api/bookings"),
        ]);

        if (!mounted) return;

        if (settingsResult.status === "fulfilled") {
          setSettings(settingsResult.value);
        } else {
          setSettings({ id: "", auto_sms_enabled: false });
        }

        if (bookingsResult.status === "fulfilled") {
          setBookings(bookingsResult.value);
        } else {
          setBookings([]);
        }

        if (settingsResult.status === "rejected" || bookingsResult.status === "rejected") {
          setError("Some data failed to load. Check Supabase connection and table permissions.");
        }
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load app");
        setSettings({ id: "", auto_sms_enabled: false });
        setBookings([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  async function onToggleChange(nextValue: boolean) {
    if (!settings?.id) {
      setError("Settings row is unavailable. Confirm Supabase table access.");
      return;
    }

    setToggleSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/garage-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_sms_enabled: nextValue }),
      });

      if (!response.ok) {
        throw new Error("Failed to save toggle");
      }

      const updated: GarageSettings = await response.json();
      setSettings(updated);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save toggle");
    } finally {
      setToggleSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F5F7] text-[#101820]">
      <div className="mx-auto w-full max-w-md px-4 pb-28 pt-6">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">MOTR</h1>
          <p className="text-sm text-[#4A5565]">Missed Call Revenue Wedge</p>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-[#4A5565]">Loading...</div>
        ) : activeTab === "capture" ? (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Revenue Capture</h2>
            <p className="mt-2 text-sm text-[#4A5565]">
              Automatically sends customers a booking link when you miss a call.
            </p>

            <button
              type="button"
              aria-pressed={!!settings?.auto_sms_enabled}
              onClick={() => onToggleChange(!settings?.auto_sms_enabled)}
              disabled={toggleSaving || !settings}
              className="mt-6 w-full rounded-2xl border border-[#D6DCE5] bg-[#F8FAFC] px-4 py-5 text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">Missed Call Auto-Text</span>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    settings?.auto_sms_enabled
                      ? "bg-[#D7FBE8] text-[#086C3A]"
                      : "bg-[#ECEFF4] text-[#485466]"
                  }`}
                >
                  {settings?.auto_sms_enabled ? "ON" : "OFF"}
                </span>
              </div>
            </button>

            <p className="mt-3 text-xs text-[#6B7280]">
              {toggleSaving ? "Saving..." : "State is persisted in Supabase."}
            </p>
          </section>
        ) : (
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Bookings</h2>

            {bookings.length === 0 ? (
              <p className="rounded-xl bg-[#F8FAFC] px-4 py-5 text-sm text-[#4A5565]">No bookings yet.</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <button
                    type="button"
                    key={booking.id}
                    onClick={() => setSelected(booking)}
                    className="w-full rounded-xl border border-[#E3E8EF] bg-[#FCFDFF] p-4 text-left"
                  >
                    <p className="text-sm font-semibold">
                      {formatDate(booking.date)} at {formatTime(booking.time)}
                    </p>
                    <p className="mt-1 text-sm">{booking.name}</p>
                    <p className="text-sm text-[#4A5565]">{booking.phone}</p>
                    <p className="text-sm text-[#4A5565]">{booking.service_type}</p>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-20 bg-black/45 px-4 pb-6 pt-20" role="dialog" aria-modal="true">
          <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-5">
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
              className="mt-5 w-full rounded-xl bg-[#101820] px-4 py-3 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 border-t border-[#DCE3EC] bg-white">
        <div className="mx-auto flex w-full max-w-md gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setActiveTab("capture")}
            className={`h-12 flex-1 rounded-xl text-sm font-semibold ${
              activeTab === "capture" ? "bg-[#101820] text-white" : "bg-[#EEF2F7] text-[#263241]"
            }`}
          >
            Revenue Capture
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            className={`h-12 flex-1 rounded-xl text-sm font-semibold ${
              activeTab === "bookings" ? "bg-[#101820] text-white" : "bg-[#EEF2F7] text-[#263241]"
            }`}
          >
            Bookings
          </button>
        </div>
      </nav>
    </main>
  );
}
