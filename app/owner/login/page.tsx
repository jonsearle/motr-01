"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function OwnerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/bookings";

  const [passcode, setPasscode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passcode.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/owner/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Invalid passcode");
      }

      router.push(next);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] text-[#1C2330]">
      <div className="mx-auto w-full max-w-md px-6 pb-20 pt-12">
        <h1 className="text-[30px] font-semibold tracking-[-0.02em]">Garage Owner Login</h1>
        <p className="mt-2 text-sm text-[#6C7583]">Enter passcode to continue.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            type="password"
            autoFocus
            placeholder="Passcode"
            className="w-full rounded-xl border border-[#D3DAE6] bg-white px-3 py-3 text-sm"
          />

          {error && <p className="rounded-lg border border-[#F2D7D7] bg-[#FFF5F5] px-3 py-2 text-sm text-[#8E2E2E]">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !passcode.trim()}
            className="w-full rounded-2xl bg-[#1D2530] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Unlocking..." : "Unlock"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function OwnerLoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#FBFCFE] p-6 text-[#1C2330]">Loading...</main>}>
      <OwnerLoginContent />
    </Suspense>
  );
}
