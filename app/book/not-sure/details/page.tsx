"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useGarageName } from "@/lib/use-garage-name";

function NotSureDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const garageName = useGarageName();

  const problem = searchParams.get("problem") || "";
  const [description, setDescription] = useState("");

  const canContinue = useMemo(() => true, []);

  function handleContinue() {
    if (!canContinue) return;

    const params = new URLSearchParams({
      service_type: "Diagnostic",
    });

    if (problem.trim()) {
      params.set("problem", problem.trim());
    }

    if (description.trim()) {
      params.set("description", description.trim());
    }

    router.push(`/book/date-time?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-gray-800 px-6 pb-24 pt-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <Link href="/book/not-sure" className="mb-6 inline-flex items-center gap-2 opacity-90">
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
        <p className="mb-6 mt-2 text-base">Is there anything else you&apos;d like us to know?</p>

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Tell us what&apos;s happening with your car (optional)"
          rows={8}
          className="w-full rounded-lg border border-white bg-transparent px-4 py-3 text-base text-white placeholder:text-gray-400"
        />

        <button
          type="button"
          onClick={handleContinue}
          className="mt-6 w-full rounded-lg bg-orange-500 px-6 py-4 text-base font-bold text-white transition-colors hover:bg-orange-600"
        >
          Continue
        </button>
      </div>
    </main>
  );
}

export default function NotSureDetailsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-800 p-6 text-white">Loading...</main>}>
      <NotSureDetailsContent />
    </Suspense>
  );
}
