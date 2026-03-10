"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DAY_KEYS, normalizeOpeningHours, type DayKey, type OpeningHours } from "@/lib/booking-hours";
import type { GarageSettings } from "@/types/db";

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

function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export default function MotorHqSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [garageName, setGarageName] = useState("N1 Mobile Auto Repairs");
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

  async function onLock() {
    try {
      await fetch("/api/motorhq/auth", { method: "DELETE" });
    } finally {
      window.location.href = "/motorhq/login";
    }
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] text-[#1C2330]">
      <div className="mx-auto w-full max-w-md px-6 pb-28 pt-6">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-[28px] font-semibold tracking-[-0.02em]">MotorHQ</h1>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onLock} className="text-sm font-medium text-[#5C6573]">
              Lock
            </button>
            <Link href="/" className="text-sm font-medium text-[#5C6573]">
              Close
            </Link>
          </div>
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
              <label className="block text-sm font-semibold text-[#2A3341]">Garage name</label>
              <input
                value={garageName}
                onChange={(event) => setGarageName(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#D5DCE7] px-3 py-2 text-sm"
                placeholder="N1 Mobile Auto Repairs"
              />
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
