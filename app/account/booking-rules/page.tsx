"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { GarageSettings } from "@/types/db";

const REQUEST_TIMEOUT_MS = 8000;

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error("request_failed");
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

function Counter({
  value,
  onChange,
  unit,
}: {
  value: number;
  onChange: (next: number) => void;
  unit?: string;
}) {
  return (
    <div className="mt-3 flex items-center gap-4">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="h-11 w-11 rounded-lg border border-[#D3D9E3] bg-white text-2xl leading-none text-[#2F3A4B]"
        aria-label="Decrease value"
      >
        -
      </button>
      <p className="min-w-[92px] text-center text-[28px] font-semibold leading-none text-[#1D2530]">
        {value}
        {unit ? <span className="ml-1 text-xl font-medium">{value === 1 ? unit : `${unit}s`}</span> : null}
      </p>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="h-11 w-11 rounded-lg border border-[#D3D9E3] bg-white text-2xl leading-none text-[#2F3A4B]"
        aria-label="Increase value"
      >
        +
      </button>
    </div>
  );
}

export default function BookingRulesPage() {
  const router = useRouter();
  const [minBookingNoticeDays, setMinBookingNoticeDays] = useState(2);
  const [maxBookingsPerDay, setMaxBookingsPerDay] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await fetchJsonWithTimeout<GarageSettings>("/api/garage-settings");
        if (!mounted) return;
        setMinBookingNoticeDays(data.min_booking_notice_days);
        setMaxBookingsPerDay(data.max_bookings_per_day);
      } catch {
        if (!mounted) return;
        setError("Couldn’t load booking rules.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function onSave() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/garage-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auto_sms_enabled: true,
          min_booking_notice_days: minBookingNoticeDays,
          max_bookings_per_day: maxBookingsPerDay,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "save_failed");
      router.push("/account?saved=rules");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Couldn’t save rules.");
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] text-[#1C2330]">
      <div className="mx-auto w-full max-w-md px-6 pb-40 pt-6">
        <header className="mb-6 flex items-center justify-between">
          <span className="w-10" />
          <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Edit booking rules</h1>
          <Link
            href="/account"
            aria-label="Close"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#657083] transition-colors hover:text-[#3E4654]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
        </header>

        {loading ? (
          <p className="text-sm text-[#657083]">Loading...</p>
        ) : (
          <div className="space-y-7">
            <section>
              <h2 className="text-base font-medium text-[#1D2530]">Minimum booking notice</h2>
              <p className="mt-1 text-sm text-[#667084]">Customers must book at least this many days ahead.</p>
              <Counter value={minBookingNoticeDays} onChange={setMinBookingNoticeDays} unit="day" />
            </section>

            <section className="border-t border-[#E8ECF2] pt-6">
              <h2 className="text-base font-medium text-[#1D2530]">Maximum bookings per day</h2>
              <p className="mt-1 text-sm text-[#667084]">Set how many online bookings you accept per day.</p>
              <Counter value={maxBookingsPerDay} onChange={setMaxBookingsPerDay} />
            </section>

            {error && (
              <p
                className="rounded-xl border border-[#F2D7D7] bg-[#FFF5F5] px-3 py-2 text-sm text-[#8E2E2E]"
              >
                {error}
              </p>
            )}
          </div>
        )}
      </div>

      {!loading && (
        <div
          className="fixed bottom-0 left-0 right-0 border-t border-[#E7EBF1] bg-[#FBFCFE] px-6 pt-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
        >
          <div className="mx-auto w-full max-w-md">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="w-full rounded-2xl bg-[#1D2530] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
