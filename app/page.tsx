"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GarageSettings } from "@/types/db";

const REQUEST_TIMEOUT_MS = 8000;

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed: ${url}`);
    }
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

function AccountIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SmartReplyIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12a7 7 0 0 1 7-7h2a7 7 0 1 1 0 14h-2l-4 3v-6a7 7 0 0 1-3-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m13 8-2.2 3h2l-1.6 5 4.8-6h-2L16 8h-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 3v4M17 3v4M4 9h16M6 6h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BottomNav({ active }: { active: "smart" | "bookings" }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 px-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}>
      <div className="mx-auto w-full max-w-md bg-[#FBFCFE] px-1 py-2">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/"
            className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-medium transition-colors ${
              active === "smart" ? "bg-[#FFEDE5] text-[#1F252E]" : "text-[#8A8F98]"
            }`}
          >
            <SmartReplyIcon />
            <span>Smart Reply</span>
          </Link>
          <Link
            href="/bookings"
            className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-medium transition-colors ${
              active === "bookings" ? "bg-[#FFEDE5] text-[#1F252E]" : "text-[#8A8F98]"
            }`}
          >
            <CalendarIcon />
            <span>Bookings</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [settings, setSettings] = useState<GarageSettings | null>(null);
  const [microPress, setMicroPress] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        const settingsData = await fetchJsonWithTimeout<GarageSettings>("/api/garage-settings");
        if (!mounted) return;
        setSettings(settingsData);
      } catch {
        if (!mounted) return;
        setSettings(null);
        setToast("Couldn’t load state.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const enabled = !!settings?.auto_sms_enabled;

  const heroCircleClasses = useMemo(() => {
    const base = "mx-auto flex aspect-square w-full max-w-[336px] items-center justify-center rounded-full text-center transition-all duration-200";

    if (loading) {
      return `${base} bg-[#ECEEF2] animate-pulse`;
    }

    if (enabled) {
      return `${base} bg-[#FF6B35] text-white shadow-[0_14px_28px_rgba(255,107,53,0.24)]`;
    }

    return `${base} bg-[#E8EAF0] text-[#373E48]`;
  }, [enabled, loading]);

  async function onToggleCircle() {
    if (loading || saving || !settings?.id) return;

    const next = !enabled;
    setMicroPress(true);
    window.setTimeout(() => setMicroPress(false), 180);

    setSettings({ ...settings, auto_sms_enabled: next });
    setSaving(true);

    try {
      const response = await fetch("/api/garage-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_sms_enabled: next }),
      });

      if (!response.ok) throw new Error("save_failed");

      const updated: GarageSettings = await response.json();
      setSettings(updated);
    } catch {
      setSettings({ ...settings, auto_sms_enabled: !next });
      setToast("Couldn’t update. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] text-[#1C2330]">
      <div className="mx-auto w-full max-w-md px-6 pb-36 pt-6">
        <header className="mb-6 flex items-center justify-end">
          <Link
            href="/account?from=smart"
            aria-label="Account"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#EEF1F5] bg-[#F8FAFC] text-[#A1A8B3]"
          >
            <AccountIcon />
          </Link>
        </header>

        <div className="flex min-h-[calc(100vh-240px)] items-center">
          <button
            type="button"
            onClick={onToggleCircle}
            disabled={loading || saving || !settings?.id}
            className={`w-full transition-transform duration-300 ${microPress ? "scale-[1.045]" : "scale-100"}`}
            aria-pressed={enabled}
          >
            <div className={heroCircleClasses}>
              <div className="w-[78%]">
                {loading ? (
                  <p className="text-sm text-[#949AA4]">Loading...</p>
                ) : (
                  <>
                    <div className={`mx-auto mb-4 flex items-center justify-center ${enabled ? "text-white" : "text-[#4A515D]"}`}>
                      <SmartReplyIcon size={30} />
                    </div>
                    <p className={`h-[74px] text-[30px] leading-[1.02] font-semibold tracking-[-0.02em] ${enabled ? "text-white" : "text-[#4A515D]"}`}>
                      <span className="block">Smart Reply</span>
                      <span className="block">{enabled ? "Active" : "Paused"}</span>
                    </p>
                    <p className={`mx-auto mt-2 h-[38px] max-w-[220px] text-[14px] leading-[1.3] ${enabled ? "text-[#FFE5DB]" : "text-[#6B727D]"}`}>
                      {enabled ? (
                        <>
                          <span className="block">Customers will receive a smart</span>
                          <span className="block">reply text automatically.</span>
                        </>
                      ) : (
                        <>
                          <span className="block">Missed callers will not</span>
                          <span className="block">receive a text.</span>
                        </>
                      )}
                    </p>
                    <p className={`mt-4 text-[30px] font-semibold tracking-[-0.02em] ${enabled ? "text-white" : "text-[#4A515D]"}`}>
                      {saving ? "..." : enabled ? "ON" : "OFF"}
                    </p>
                  </>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>

      <BottomNav active="smart" />

      {toast && (
        <div className="fixed left-1/2 top-5 z-30 -translate-x-1/2 rounded-full bg-[#1E222B] px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
