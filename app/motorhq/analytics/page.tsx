"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const METRIC_LABELS: Array<{ key: string; label: string }> = [
  { key: "booking_click", label: "Booking link clicks" },
  { key: "booking_completed", label: "Bookings completed" },
  { key: "page_view_book", label: "Visits: /book" },
  { key: "page_view_date_time", label: "Visits: /book/date-time" },
  { key: "page_view_mobile", label: "Visits: /book/mobile" },
  { key: "page_view_confirmation", label: "Visits: /book/confirmation" },
  { key: "page_view_custom_job", label: "Visits: /book/custom-job" },
  { key: "page_view_not_sure", label: "Visits: /book/not-sure" },
  { key: "page_view_not_sure_details", label: "Visits: /book/not-sure/details" },
  { key: "whatsapp_click", label: "WhatsApp clicks" },
  { key: "missed_call", label: "Missed calls tracked" },
  { key: "sms_sent", label: "Reply SMS sent" },
];

interface MotorHqMetrics {
  bookings_count: number;
  tracking_counts: Record<string, number>;
}

export default function MotorHqAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [trackingCounts, setTrackingCounts] = useState<Record<string, number>>({});

  const totalTrackedVisits = useMemo(() => {
    return Object.entries(trackingCounts)
      .filter(([key]) => key.startsWith("page_view_"))
      .reduce((sum, [, count]) => sum + count, 0);
  }, [trackingCounts]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await fetch("/api/motorhq/metrics", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load metrics");

        const metrics = (await response.json()) as MotorHqMetrics;
        if (!mounted) return;

        setBookingsCount(metrics.bookings_count ?? 0);
        setTrackingCounts(metrics.tracking_counts ?? {});
      } catch {
        if (!mounted) return;
        setError("Could not load MotorHQ analytics.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function onLock() {
    try {
      await fetch("/api/motorhq/auth", { method: "DELETE" });
    } finally {
      window.location.href = "/motorhq/login";
    }
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] text-[#1C2330]">
      <div className="mx-auto w-full max-w-md px-6 pb-12 pt-6">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-[28px] font-semibold tracking-[-0.02em]">MotorHQ</h1>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onLock} className="text-sm font-medium text-[#5C6573]">
              Lock
            </button>
            <Link href="/" className="text-sm font-medium text-[#5C6573]">
              Close
            </Link>
          </div>
        </header>

        <nav className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-[#E4E8EF] bg-white p-1">
          <Link
            href="/motorhq/analytics"
            className="rounded-lg bg-[#1D2530] px-3 py-2 text-center text-sm font-semibold text-white"
          >
            Analytics
          </Link>
          <Link
            href="/motorhq/settings"
            className="rounded-lg px-3 py-2 text-center text-sm font-semibold text-[#5B6472] transition-colors hover:bg-[#F3F6FA]"
          >
            Settings
          </Link>
        </nav>

        {loading ? (
          <p className="text-sm text-[#657083]">Loading...</p>
        ) : (
          <div className="space-y-6">
            <section className="rounded-xl border border-[#E4E8EF] bg-white p-4">
              <h2 className="text-sm font-semibold text-[#2A3341]">Topline</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#E7EBF2] bg-[#FAFCFF] p-3">
                  <p className="text-xs text-[#657083]">Total bookings</p>
                  <p className="mt-1 text-2xl font-semibold text-[#1E2531]">{bookingsCount}</p>
                </div>
                <div className="rounded-lg border border-[#E7EBF2] bg-[#FAFCFF] p-3">
                  <p className="text-xs text-[#657083]">Tracked page visits</p>
                  <p className="mt-1 text-2xl font-semibold text-[#1E2531]">{totalTrackedVisits}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[#E4E8EF] bg-white p-4">
              <h2 className="text-sm font-semibold text-[#2A3341]">Analytics</h2>
              <div className="mt-3 space-y-2">
                {METRIC_LABELS.map((metric) => (
                  <div key={metric.key} className="flex items-center justify-between rounded-md border border-[#E9EDF3] px-3 py-2">
                    <span className="text-sm text-[#2A3341]">{metric.label}</span>
                    <span className="text-sm font-semibold text-[#1E2531]">{trackingCounts[metric.key] ?? 0}</span>
                  </div>
                ))}
              </div>
            </section>

            {error && (
              <p className="rounded-lg border border-[#F2D7D7] bg-[#FFF5F5] px-3 py-2 text-sm text-[#8E2E2E]">{error}</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
