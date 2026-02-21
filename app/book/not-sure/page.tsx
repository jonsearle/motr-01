"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const PROBLEMS = [
  "Strange noise",
  "Warning light on dashboard",
  "Brakes feel wrong",
  "Engine performance issue",
  "Battery or starting issue",
];

export default function NotSurePage() {
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
        // Keep fallback name
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
        <Link href="/book" className="mb-6 inline-flex items-center gap-2 opacity-90">
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
        <p className="mb-6 mt-2 text-base">What&apos;s the problem?</p>

        <div className="space-y-4">
          {PROBLEMS.map((problem) => (
            <Link
              key={problem}
              href={`/book/date-time?service_type=${encodeURIComponent("Diagnostic")}&description=${encodeURIComponent(problem)}`}
              className="block rounded-lg border border-white p-4 transition-colors hover:bg-gray-700 active:bg-gray-600"
            >
              <p className="text-base font-bold">{problem}</p>
            </Link>
          ))}

          <Link
            href="/book/custom-job"
            className="block rounded-lg border border-white p-4 transition-colors hover:bg-gray-700 active:bg-gray-600"
          >
            <p className="text-base font-bold">Something else</p>
            <p className="mt-1 text-sm text-gray-200">Describe the issue in your own words.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
