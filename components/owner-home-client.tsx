"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { OwnerBottomNav } from "@/components/owner-bottom-nav";
import { useTrackPageView } from "@/lib/use-track-page-view";
import type { GarageSettings } from "@/types/db";

const DISPLAY_DOMAIN = (process.env.NEXT_PUBLIC_APP_BASE_URL || "https://motr.one").replace(/\/$/, "");

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OnlineBookingIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 14a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 14"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 10a5 5 0 0 1 0 7L12.5 18.5a5 5 0 1 1-7-7L7 10"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function OwnerHomeClient({ initialSettings }: { initialSettings: GarageSettings }) {
  useTrackPageView("page_view_owner_home");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [settings, setSettings] = useState<GarageSettings>(initialSettings);
  const [microPress, setMicroPress] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const saved = params.get("saved");
    if (saved === "reply") {
      setToast("Reply settings saved.");
    } else if (saved === "rules") {
      setToast("Booking rules saved.");
    }
    if (saved) {
      params.delete("saved");
      const next = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${next ? `?${next}` : ""}`);
    }
  }, []);

  const enabled = !!settings.booking_hours_enabled;
  const bookingLink = settings.short_code?.trim()
    ? `${DISPLAY_DOMAIN}/b/${settings.short_code.trim()}`
    : `${DISPLAY_DOMAIN}/book`;

  const heroCircleClasses = useMemo(() => {
    const base = "mx-auto flex aspect-square w-full max-w-[336px] items-center justify-center rounded-full text-center transition-all duration-200";

    if (enabled) {
      return `${base} bg-[#FF6B35] text-white shadow-[0_14px_28px_rgba(255,107,53,0.24)]`;
    }

    return `${base} bg-[#E8EAF0] text-[#373E48]`;
  }, [enabled]);

  async function onToggleCircle() {
    if (saving || !settings.id) return;

    const next = !enabled;
    const previousSettings = settings;

    setMicroPress(true);
    window.setTimeout(() => setMicroPress(false), 180);
    setSettings({ ...settings, booking_hours_enabled: next });
    setSaving(true);

    try {
      const response = await fetch("/api/garage-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_hours_enabled: next }),
      });

      if (!response.ok) throw new Error("save_failed");

      const updated: GarageSettings = await response.json();
      setSettings(updated);
    } catch {
      setSettings(previousSettings);
      setToast("Couldn’t update. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function onCopyBookingLink() {
    const garageName = settings.garage_name?.trim() || "our garage";
    const message = `Hello there,

You can book online with ${garageName} here:
${bookingLink}

If you need any help, just reply to this message.`;

    try {
      await navigator.clipboard.writeText(message);
      setToast("Booking link copied.");
    } catch {
      window.alert("Couldn’t copy booking link. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] text-[#1C2330]">
      <div className="mx-auto w-full max-w-md px-6 pb-36 pt-6">
        <header className="mb-6 flex items-center justify-end gap-4">
          <Link
            href="/account/booking-rules"
            aria-label="Edit booking rules"
            className="inline-flex items-center gap-1.5 text-[15px] font-medium text-[#6E7785] transition-colors hover:text-[#404854]"
          >
            <span>Edit booking rules</span>
            <EditIcon />
          </Link>
        </header>

        <div className="flex min-h-[calc(100vh-240px)] items-center">
          <div className="w-full">
            <button
              type="button"
              onClick={onToggleCircle}
              disabled={saving || !settings.id}
              className={`w-full transition-transform duration-300 ${microPress ? "scale-[1.045]" : "scale-100"}`}
              aria-pressed={enabled}
            >
              <div className={heroCircleClasses}>
                <div className="w-[78%]">
                  <div className={`mx-auto mb-4 flex items-center justify-center ${enabled ? "text-white" : "text-[#4A515D]"}`}>
                    <OnlineBookingIcon size={30} />
                  </div>
                  <p
                    className={`h-[74px] text-[30px] leading-[1.02] font-semibold tracking-[-0.02em] ${enabled ? "text-white" : "text-[#4A515D]"}`}
                  >
                    <span className="block">Online Bookings</span>
                    <span className="block">{enabled ? "ON" : "OFF"}</span>
                  </p>
                  <p className={`mx-auto mt-2 h-[38px] max-w-[220px] text-[14px] leading-[1.3] ${enabled ? "text-[#FFE5DB]" : "text-[#6B727D]"}`}>
                    {enabled ? (
                      <>
                        <span className="block">Customers can book online</span>
                        <span className="block">right now.</span>
                      </>
                    ) : (
                      <>
                        <span className="block">Online booking is currently</span>
                        <span className="block">paused.</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={onCopyBookingLink}
              className="mx-auto mt-8 inline-flex items-center justify-center gap-2 text-center text-[15px] font-medium text-[#7B8491] transition-colors hover:text-[#59616D]"
            >
              <CopyIcon />
              Copy booking link
            </button>
          </div>
        </div>
      </div>

      <OwnerBottomNav active="online" />

      {toast && (
        <div className="fixed left-1/2 top-5 z-30 -translate-x-1/2 rounded-full bg-[#1E222B] px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
