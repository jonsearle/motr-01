"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTrackPageView } from "@/lib/use-track-page-view";

const DETAIL_METRIC_LABELS: Array<{ key: string; label: string }> = [
  { key: "call_us_click", label: "Call us button clicks" },
  { key: "whatsapp_click", label: "WhatsApp clicks" },
  { key: "missed_call", label: "Missed calls tracked" },
  { key: "sms_sent", label: "Reply SMS sent" },
];

interface MotorHqMetrics {
  bookings_count: number;
  tracking_counts: Record<string, number>;
}

export default function MotorHqAnalyticsPage() {
  useTrackPageView("page_view_motorhq_analytics");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [trackingCounts, setTrackingCounts] = useState<Record<string, number>>({});

  const topMetrics = useMemo(() => {
    const totalBookings = bookingsCount;
    const bookingFlowVisits = trackingCounts.page_view_book ?? 0;
    const visitsFromWebsite = trackingCounts.entry_website ?? 0;
    const visitsFromGmbBooking = trackingCounts.entry_gmb_booking ?? 0;
    const garageAppOpens =
      (trackingCounts.page_view_owner_home ?? 0) +
      (trackingCounts.page_view_owner_bookings ?? 0) +
      (trackingCounts.page_view_motorhq_analytics ?? 0) +
      (trackingCounts.page_view_motorhq_settings ?? 0);

    return [
      { label: "Total bookings made", value: totalBookings },
      { label: "Total visits to booking flow", value: bookingFlowVisits },
      { label: "Visits from website link", value: visitsFromWebsite },
      { label: "Visits from Google Book link", value: visitsFromGmbBooking },
      { label: "Garage app opens", value: garageAppOpens },
    ];
  }, [bookingsCount, trackingCounts]);

  const funnelSteps = useMemo(() => {
    const steps = [
      { label: "Booking flow opened", count: trackingCounts.page_view_book ?? 0 },
      { label: "Date/time step", count: trackingCounts.page_view_date_time ?? 0 },
      { label: "Customer details step", count: trackingCounts.page_view_mobile ?? 0 },
      { label: "Confirmation page", count: trackingCounts.page_view_confirmation ?? 0 },
      { label: "Booking submitted", count: bookingsCount },
    ];

    return steps.map((step, index) => {
      if (index === 0) return { ...step, conversion: 100 };
      const previous = steps[index - 1].count;
      const raw = previous > 0 ? Math.round((step.count / previous) * 100) : 0;
      const conversion = Math.min(100, raw);
      return { ...step, conversion };
    });
  }, [trackingCounts, bookingsCount]);

  const serviceBreakdown = useMemo(() => {
    return [
      { label: "MOT bookings", value: trackingCounts.booking_completed_mot ?? 0 },
      { label: "Interim Service bookings", value: trackingCounts.booking_completed_interim_service ?? 0 },
      { label: "Full Service bookings", value: trackingCounts.booking_completed_full_service ?? 0 },
      { label: "Diagnostics bookings", value: trackingCounts.booking_completed_diagnostics ?? 0 },
      { label: "Know exactly what you need", value: trackingCounts.booking_completed_custom_job ?? 0 },
      { label: "I'm not sure what's wrong", value: trackingCounts.booking_completed_not_sure ?? 0 },
    ];
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
                {topMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-lg border border-[#E7EBF2] bg-[#FAFCFF] p-3">
                    <p className="text-xs text-[#657083]">{metric.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-[#1E2531]">{metric.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-[#E4E8EF] bg-white p-4">
              <h2 className="text-sm font-semibold text-[#2A3341]">Booking Funnel</h2>
              <p className="mt-1 text-xs text-[#6D7684]">Counts and conversion at each key step (session-deduped).</p>
              <div className="mt-3 overflow-x-auto">
                <div className="flex min-w-[760px] items-stretch gap-2">
                  {funnelSteps.map((step, index) => (
                    <div key={step.label} className="flex items-center gap-2">
                      <div className="w-36 rounded-lg border border-[#E9EDF3] bg-white px-3 py-3">
                        <p className="text-xs text-[#657083]">{step.label}</p>
                        <p className="mt-1 text-xl font-semibold text-[#1E2531]">{step.count}</p>
                        <p className="mt-1 text-xs font-medium text-[#5A6473]">{step.conversion}% from previous</p>
                      </div>
                      {index < funnelSteps.length - 1 && <span className="text-[#A2AAB7]">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[#E4E8EF] bg-white p-4">
              <h2 className="text-sm font-semibold text-[#2A3341]">Bookings by Service Type</h2>
              <div className="mt-3 space-y-2">
                {serviceBreakdown.map((metric) => (
                  <div key={metric.label} className="flex items-center justify-between rounded-md border border-[#E9EDF3] px-3 py-2">
                    <span className="text-sm text-[#2A3341]">{metric.label}</span>
                    <span className="text-sm font-semibold text-[#1E2531]">{metric.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-[#E4E8EF] bg-white p-4">
              <h2 className="text-sm font-semibold text-[#2A3341]">Additional Metrics</h2>
              <div className="mt-3 space-y-2">
                {DETAIL_METRIC_LABELS.map((metric) => (
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
