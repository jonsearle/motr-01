"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function CustomJobPage() {
  const router = useRouter();
  const [garageName, setGarageName] = useState("MOTR Garage");
  const [description, setDescription] = useState("");

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

  const canContinue = useMemo(() => description.trim().length > 0, [description]);

  function handleContinue() {
    if (!canContinue) return;
    const params = new URLSearchParams({
      service_type: "Custom Job",
      description: description.trim(),
    });
    router.push(`/book/date-time?${params.toString()}`);
  }

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
        <p className="mb-6 mt-2 text-base">Describe the issue.</p>

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Tell us what’s happening with your car"
          rows={8}
          className="w-full rounded-lg border border-white bg-transparent px-4 py-3 text-base text-white placeholder:text-gray-400"
        />

        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className="mt-6 w-full rounded-lg bg-orange-500 px-6 py-4 text-base font-bold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </main>
  );
}
