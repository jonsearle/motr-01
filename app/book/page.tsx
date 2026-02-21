"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
const SERVICE_OPTIONS = [
  {
    label: "MOT",
    description: "Annual safety and compliance check.",
  },
  {
    label: "Interim Service",
    description: "Basic checks and fluid top-ups between full services.",
  },
  {
    label: "Full Service",
    description: "Comprehensive inspection and maintenance.",
  },
  {
    label: "Diagnostics",
    description: "Fault finding for warning lights and performance issues.",
  },
];

export default function BookPage() {
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

  return (
    <main className="min-h-screen bg-gray-800 px-6 pb-24 pt-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 opacity-90">
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
        <p className="mb-6 mt-2 text-base">How can we help you?</p>

        <div className="space-y-4">
          {SERVICE_OPTIONS.map((option) => (
            <Link
              key={option.label}
              href={`/book/date-time?service_type=${encodeURIComponent(option.label)}`}
              className="block rounded-lg border border-white p-4 transition-colors hover:bg-gray-700 active:bg-gray-600"
            >
              <p className="text-base font-bold">{option.label}</p>
              <p className="mt-1 text-sm text-gray-200">{option.description}</p>
            </Link>
          ))}

          <Link
            href="/book/date-time?service_type=Custom%20Job"
            className="block rounded-lg border border-white p-4 transition-colors hover:bg-gray-700 active:bg-gray-600"
          >
            <p className="text-base font-bold">Know exactly what you need?</p>
            <p className="mt-1 text-sm text-gray-200">Describe the job and we&apos;ll get it booked in.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
