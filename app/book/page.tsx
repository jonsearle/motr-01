"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

const SERVICE_TYPES = ["MOT", "Service", "Diagnostics", "Repair"];
const TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];

function todayIso(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function BookPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState(TIME_SLOTS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && phone.trim().length > 0 && serviceType.trim().length > 0;
  }, [name, phone, serviceType]);

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
      router.push(`/book/confirmation?id=${booking.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Booking failed");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F5F7] pb-8 pt-6 text-[#101820]">
      <div className="mx-auto w-full max-w-md px-4">
        <Link href="/" className="inline-flex rounded-lg bg-[#E8EDF5] px-3 py-2 text-sm font-medium">
          Back
        </Link>

        <h1 className="mt-5 text-2xl font-semibold">Book Appointment</h1>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-5 space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="h-12 w-full rounded-xl border border-[#CED6E2] px-3 text-base"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Phone</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
              className="h-12 w-full rounded-xl border border-[#CED6E2] px-3 text-base"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Service Type</span>
            <select
              value={serviceType}
              onChange={(event) => setServiceType(event.target.value)}
              required
              className="h-12 w-full rounded-xl border border-[#CED6E2] px-3 text-base"
            >
              {SERVICE_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Description (optional)</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-[#CED6E2] px-3 py-2 text-base"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              min={todayIso()}
              className="h-12 w-full rounded-xl border border-[#CED6E2] px-3 text-base"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Time</span>
            <select
              value={time}
              onChange={(event) => setTime(event.target.value)}
              required
              className="h-12 w-full rounded-xl border border-[#CED6E2] px-3 text-base"
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="h-12 w-full rounded-xl bg-[#101820] text-base font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Booking..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </main>
  );
}
