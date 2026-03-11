"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DAY_KEYS, normalizeOpeningHours, type DayKey, type OpeningHours } from "@/lib/booking-hours";
import type { GarageSettings, ReviewFeedback } from "@/types/db";

const DAY_LABELS: Record<DayKey, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const DISPLAY_DOMAIN = "https://motr.one";

function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function MessageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MotorHqSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<ReviewFeedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<ReviewFeedback | null>(null);

  const [garageName, setGarageName] = useState("N1 Mobile Auto Repairs");
  const [shortCode, setShortCode] = useState("4b600c");
  const [bookingAlertPhone, setBookingAlertPhone] = useState("07968777469");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [bookingHoursEnabled, setBookingHoursEnabled] = useState(true);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(normalizeOpeningHours(null));

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await fetch("/api/garage-settings", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load settings");

        const settings = (await response.json()) as GarageSettings;
        if (!mounted) return;

        setGarageName(settings.garage_name || "N1 Mobile Auto Repairs");
        setShortCode(settings.short_code || "4b600c");
        setBookingAlertPhone(settings.booking_alert_phone || "07968777469");
        setGoogleReviewUrl(settings.google_review_url || "");
        setBookingHoursEnabled(settings.booking_hours_enabled);
        setOpeningHours(normalizeOpeningHours(settings.opening_hours));
      } catch {
        if (!mounted) return;
        setError("Could not load MotorHQ settings.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  function updateDay(key: DayKey, patch: Partial<OpeningHours[DayKey]>) {
    setOpeningHours((current) => {
      const nextDay = { ...current[key], ...patch };
      if (nextDay.endHour <= nextDay.startHour) {
        nextDay.endHour = Math.min(23, nextDay.startHour + 1);
      }
      return { ...current, [key]: nextDay };
    });
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const garageNameResponse = await fetch("/api/garage-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garage_name: garageName.trim() || "N1 Mobile Auto Repairs",
          google_review_url: googleReviewUrl.trim(),
        }),
      });

      const garageNameBody = await garageNameResponse.json().catch(() => ({}));
      if (!garageNameResponse.ok) {
        throw new Error(garageNameBody.error || "Could not save garage name");
      }

      const scheduleResponse = await fetch("/api/garage-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_hours_enabled: bookingHoursEnabled,
          booking_alert_phone: bookingAlertPhone.trim(),
          opening_hours: openingHours,
        }),
      });

      const scheduleBody = await scheduleResponse.json().catch(() => ({}));
      if (!scheduleResponse.ok) {
        const message =
          scheduleBody.error || "Garage name saved, but booking-hours settings could not be saved on this database.";
        setSuccess("MotorHQ garage name saved.");
        setError(message);
        return;
      }

      setSuccess("MotorHQ settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save MotorHQ settings.");
    } finally {
      setSaving(false);
    }
  }

  function formatFeedbackTimestamp(value: string): string {
    return new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function loadFeedback() {
    setFeedbackLoading(true);
    setFeedbackError(null);

    try {
      const response = await fetch("/api/review-feedback", { cache: "no-store" });
      if (!response.ok) throw new Error("load_failed");
      const data = (await response.json()) as ReviewFeedback[];
      setFeedbackItems(data);
    } catch {
      setFeedbackError("Could not load feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] text-[#1C2330]">
      <div className="mx-auto w-full max-w-md px-6 pb-28 pt-6">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-[28px] font-semibold tracking-[-0.02em]">MotorHQ</h1>
          <button
            type="button"
            aria-label="Open feedback messages"
            title="Feedback messages"
            onClick={() => {
              setShowFeedback(true);
              setSelectedFeedback(null);
              void loadFeedback();
            }}
            className="rounded-lg border border-[#D7DDE6] bg-white p-2 text-[#556070] hover:bg-[#EEF2F7]"
          >
            <MessageIcon />
          </button>
        </header>

        <nav className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-[#E4E8EF] bg-white p-1">
          <Link
            href="/motorhq/analytics"
            className="rounded-lg px-3 py-2 text-center text-sm font-semibold text-[#5B6472] transition-colors hover:bg-[#F3F6FA]"
          >
            Analytics
          </Link>
          <Link
            href="/motorhq/settings"
            className="rounded-lg bg-[#1D2530] px-3 py-2 text-center text-sm font-semibold text-white"
          >
            Settings
          </Link>
        </nav>

        {loading ? (
          <p className="text-sm text-[#657083]">Loading...</p>
        ) : (
          <div className="space-y-6">
            <section className="rounded-xl border border-[#E4E8EF] bg-white p-4">
              <h2 className="text-sm font-semibold text-[#2A3341]">Google links</h2>
              <p className="mt-1 text-xs text-[#6D7684]">Use these in Google Business Profile.</p>

              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs font-medium text-[#5B6472]">Website link</p>
                  <a
                    href={`${DISPLAY_DOMAIN}/book?src=website`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block break-all text-sm text-[#1E4FA8] underline"
                  >
                    {DISPLAY_DOMAIN}/book?src=website
                  </a>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#5B6472]">Book online link</p>
                  <a
                    href={`${DISPLAY_DOMAIN}/b/${shortCode}?src=gmb_booking`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block break-all text-sm text-[#1E4FA8] underline"
                  >
                    {`${DISPLAY_DOMAIN}/b/${shortCode}?src=gmb_booking`}
                  </a>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#5B6472]">Short review link (for SMS)</p>
                  <p className="mt-1 break-all text-sm text-[#2A3341]">{`${DISPLAY_DOMAIN}/r/${shortCode}`}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#5B6472]">Review flow test link</p>
                  <a
                    href={`${DISPLAY_DOMAIN}/review/${shortCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex rounded-lg border border-[#D5DCE7] bg-white px-3 py-1.5 text-sm font-medium text-[#1F252E] hover:bg-[#F5F7FA]"
                  >
                    Test review flow
                  </a>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[#E4E8EF] bg-white p-4">
              <label className="block text-sm font-semibold text-[#2A3341]">Garage name</label>
              <input
                value={garageName}
                onChange={(event) => setGarageName(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#D5DCE7] px-3 py-2 text-sm"
                placeholder="N1 Mobile Auto Repairs"
              />
            </section>

            <section className="rounded-xl border border-[#E4E8EF] bg-white p-4">
              <label className="block text-sm font-semibold text-[#2A3341]">Booking alert phone</label>
              <input
                value={bookingAlertPhone}
                onChange={(event) => setBookingAlertPhone(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#D5DCE7] px-3 py-2 text-sm"
                placeholder="07968777469"
              />
              <p className="mt-2 text-xs text-[#6D7684]">Number that receives new booking alert texts.</p>
            </section>

            <section className="rounded-xl border border-[#E4E8EF] bg-white p-4">
              <label className="block text-sm font-semibold text-[#2A3341]">Google review URL</label>
              <input
                value={googleReviewUrl}
                onChange={(event) => setGoogleReviewUrl(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#D5DCE7] px-3 py-2 text-sm"
                placeholder="https://g.page/r/..."
              />
              <p className="mt-2 text-xs text-[#6D7684]">
                Used when sending review requests. Customers receive the short MOTR link which redirects to this URL.
              </p>
            </section>

            <section className="rounded-xl border border-[#E4E8EF] bg-white p-4">
              <label className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#2A3341]">Online booking enabled</span>
                <input
                  type="checkbox"
                  checked={bookingHoursEnabled}
                  onChange={(event) => setBookingHoursEnabled(event.target.checked)}
                />
              </label>
              <p className="mt-2 text-xs text-[#6D7684]">If off, booking link shows unavailable state.</p>
            </section>

            <section className="rounded-xl border border-[#E4E8EF] bg-white p-4">
              <h2 className="text-sm font-semibold text-[#2A3341]">Opening hours</h2>
              <p className="mt-1 text-xs text-[#6D7684]">Hourly slots are generated between start and end for each open day.</p>

              <div className="mt-4 space-y-3">
                {DAY_KEYS.map((key) => {
                  const day = openingHours[key];
                  const endHourOptions = HOUR_OPTIONS.filter((hour) => hour > day.startHour);

                  return (
                    <div key={key} className="rounded-lg border border-[#E5E9F0] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#2B3442]">{DAY_LABELS[key]}</span>
                        <label className="flex items-center gap-2 text-xs text-[#5B6472]">
                          <input
                            type="checkbox"
                            checked={day.enabled}
                            onChange={(event) => updateDay(key, { enabled: event.target.checked })}
                          />
                          Open
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs text-[#5B6472]">
                          Start
                          <select
                            className="mt-1 w-full rounded-md border border-[#D5DCE7] px-2 py-1.5 text-sm"
                            value={day.startHour}
                            onChange={(event) => updateDay(key, { startHour: Number(event.target.value) })}
                            disabled={!day.enabled}
                          >
                            {HOUR_OPTIONS.slice(0, 23).map((hour) => (
                              <option key={hour} value={hour}>
                                {formatHourLabel(hour)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="text-xs text-[#5B6472]">
                          End
                          <select
                            className="mt-1 w-full rounded-md border border-[#D5DCE7] px-2 py-1.5 text-sm"
                            value={day.endHour}
                            onChange={(event) => updateDay(key, { endHour: Number(event.target.value) })}
                            disabled={!day.enabled}
                          >
                            {endHourOptions.map((hour) => (
                              <option key={hour} value={hour}>
                                {formatHourLabel(hour)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {error && <p className="rounded-lg border border-[#F2D7D7] bg-[#FFF5F5] px-3 py-2 text-sm text-[#8E2E2E]">{error}</p>}
            {success && <p className="rounded-lg border border-[#D4ECD9] bg-[#F3FFF5] px-3 py-2 text-sm text-[#2A6A35]">{success}</p>}
          </div>
        )}
      </div>

      {showFeedback && (
        <div className="fixed inset-0 z-40 bg-[#FBFCFE]" role="dialog" aria-modal="true">
          <div className="mx-auto flex h-full w-full max-w-md flex-col px-6 pb-6 pt-6">
            {!selectedFeedback ? (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-[28px] font-semibold tracking-[-0.02em]">Feedback Messages</h3>
                </div>

                {feedbackError && <p className="mb-3 text-sm text-[#8E2E2E]">{feedbackError}</p>}

                {feedbackLoading ? (
                  <div className="space-y-3">
                    <div className="h-20 animate-pulse rounded-2xl bg-white" />
                    <div className="h-20 animate-pulse rounded-2xl bg-white" />
                  </div>
                ) : feedbackItems.length === 0 ? (
                  <p className="py-6 text-sm text-[#737A85]">No low-rating feedback yet.</p>
                ) : (
                  <div className="divide-y divide-[#ECEFF4]">
                    {feedbackItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedFeedback(item)}
                        className="w-full py-4 text-left transition-colors hover:bg-[#F7F9FC]"
                      >
                        <p className="text-sm font-semibold text-[#1F252E]">{item.customer_name || "Customer feedback"}</p>
                        <p className="mt-1 text-sm text-[#606875]">{item.vehicle_reg || "No reg provided"}</p>
                        {item.booking_note && <p className="mt-1 text-sm text-[#606875]">{item.booking_note}</p>}
                        <p className="mt-1 text-sm text-[#303745]">{item.message}</p>
                        <p className="mt-1 text-xs text-[#8A92A0]">
                          {item.rating}/5 stars • {formatFeedbackTimestamp(item.created_at)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFeedback(false);
                      setSelectedFeedback(null);
                    }}
                    className="w-full rounded-xl bg-[#1F252E] px-4 py-3 text-sm font-semibold text-white"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-[28px] font-semibold tracking-[-0.02em]">Feedback Details</h3>
                </div>

                <div className="space-y-3 text-sm text-[#303745]">
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-[#1F252E]">Name:</span>
                    <span>{selectedFeedback.customer_name || "Unknown"}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-[#1F252E]">Vehicle Reg:</span>
                    <span>{selectedFeedback.vehicle_reg || "Not provided"}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-[#1F252E]">Rating:</span>
                    <span>{selectedFeedback.rating}/5</span>
                  </p>
                  {selectedFeedback.booking_note && (
                    <div className="pt-1">
                      <p className="font-semibold text-[#1F252E]">Booking Description:</p>
                      <p className="mt-1 whitespace-pre-wrap text-[#303745]">{selectedFeedback.booking_note}</p>
                    </div>
                  )}
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-[#1F252E]">Received:</span>
                    <span>{formatFeedbackTimestamp(selectedFeedback.created_at)}</span>
                  </p>
                  <div className="pt-1">
                    <p className="font-semibold text-[#1F252E]">Feedback:</p>
                    <p className="mt-1 whitespace-pre-wrap text-[#303745]">{selectedFeedback.message}</p>
                  </div>
                </div>

                <div className="mt-auto space-y-2 pt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedFeedback(null)}
                    className="w-full rounded-xl border border-[#D7DDE6] bg-white px-4 py-3 text-sm font-semibold text-[#1F252E]"
                  >
                    Back to Messages
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFeedback(false);
                      setSelectedFeedback(null);
                    }}
                    className="w-full rounded-xl bg-[#1F252E] px-4 py-3 text-sm font-semibold text-white"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 border-t border-[#E7EBF1] bg-[#FBFCFE] px-6 py-3">
        <div className="mx-auto w-full max-w-md">
          <button
            type="button"
            onClick={onSave}
            disabled={loading || saving}
            className="w-full rounded-2xl bg-[#1D2530] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save MotorHQ settings"}
          </button>
        </div>
      </div>
    </main>
  );
}
