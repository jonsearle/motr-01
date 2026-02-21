"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";

function MobileFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const serviceType = searchParams.get("service_type") || "MOT";
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";
  const initialDescription = searchParams.get("description") || "";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState(initialDescription);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [garageName, setGarageName] = useState("MOTR Garage");

  useEffect(() => {
    let mounted = true;

    async function loadGarageName() {
      try {
        const response = await fetch("/api/garage-settings", { cache: "no-store" });
        if (!response.ok) return;
        const body = (await response.json()) as { garage_name?: string };
        const nextName = body.garage_name?.trim();
        if (mounted && nextName) setGarageName(nextName);
      } catch {
        // Keep fallback name if settings load fails.
      }
    }

    loadGarageName();
    return () => {
      mounted = false;
    };
  }, []);

  const canSubmit = useMemo(() => {
    return !!date && !!time && name.trim().length > 0 && phone.trim().length > 0;
  }, [date, time, name, phone]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          service_type: serviceType,
          description,
          date,
          time,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create booking");
      }

      const booking = await response.json();
      router.push(`/book/confirmation?id=${booking.id}&date=${date}&time=${time}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Booking failed");
      setSubmitting(false);
    }
  }

  if (!date || !time) {
    return (
      <main className="min-h-screen bg-gray-800 px-6 pb-24 pt-8 text-white">
        <div className="mx-auto w-full max-w-md">
          <p className="mb-4 text-lg font-semibold">Booking details missing</p>
          <Link href="/book/date-time" className="text-orange-400 underline">
            Go back to choose date and time
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-800 px-6 pb-24 pt-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <Link href={`/book/date-time?service_type=${encodeURIComponent(serviceType)}`} className="mb-6 inline-flex items-center gap-2 opacity-90">
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

        <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Book an appointment</h1>
        <p className="mb-6 mt-2 text-base">Enter your details</p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500 bg-red-900/40 p-3 text-sm text-white">{error}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your name"
            required
            className="h-12 w-full rounded-lg border border-white bg-transparent px-4 text-base text-white placeholder:text-gray-400"
          />

          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Enter mobile number"
            required
            className="h-12 w-full rounded-lg border border-white bg-transparent px-4 text-base text-white placeholder:text-gray-400"
          />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional description"
            rows={4}
            className="w-full rounded-lg border border-white bg-transparent px-4 py-3 text-base text-white placeholder:text-gray-400"
          />

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full rounded-lg bg-orange-500 py-4 text-base font-bold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Booking..." : "Book now"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function MobileFormPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-800 p-6 text-white">Loading...</main>}>
      <MobileFormContent />
    </Suspense>
  );
}
