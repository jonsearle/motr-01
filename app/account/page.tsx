"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { normalizeWhatsappNumber } from "@/lib/missed-call";
import type { GarageSettings } from "@/types/db";

type AccountFormState = Pick<
  GarageSettings,
  | "garage_name"
  | "cta_booking_enabled"
  | "cta_whatsapp_enabled"
  | "cta_phone_enabled"
  | "whatsapp_number"
  | "garage_phone"
>;

const REQUEST_TIMEOUT_MS = 8000;

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error("request_failed");
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span className="text-[18px] font-medium leading-tight text-[#1D2530]">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
          checked ? "bg-[#FF6B35]" : "bg-[#D8DEE6]"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
}) {
  return (
    <label className="mt-3 block">
      <span className="mb-1.5 block text-sm font-semibold text-[#2E3643]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#E3E8EF] bg-[#FCFDFE] px-3 py-2 text-sm outline-none focus:border-[#B4C0D1]"
        placeholder={placeholder}
      />
      <p className="mt-1.5 text-xs text-[#7B8492]">
        Use international format e.g. +44 7700 900123.
      </p>
    </label>
  );
}

export default function AccountPage() {
  const [backHref, setBackHref] = useState("/");
  const [settings, setSettings] = useState<GarageSettings | null>(null);
  const [form, setForm] = useState<AccountFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setBackHref(params.get("from") === "bookings" ? "/bookings" : "/");
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await fetchJsonWithTimeout<GarageSettings>("/api/garage-settings");
        if (!mounted) return;
        setSettings(data);
        setForm({
          garage_name: data.garage_name,
          cta_booking_enabled: data.cta_booking_enabled,
          cta_whatsapp_enabled: data.cta_whatsapp_enabled,
          cta_phone_enabled: data.cta_phone_enabled,
          whatsapp_number: data.whatsapp_number,
          garage_phone: data.garage_phone,
        });
      } catch {
        if (!mounted) return;
        setError("Couldn’t load account settings.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const validationError = useMemo(() => {
    if (!form) return null;
    const enabledCount =
      Number(form.cta_booking_enabled) +
      Number(form.cta_whatsapp_enabled) +
      Number(form.cta_phone_enabled);

    if (enabledCount < 1) return "Enable at least one message option.";
    if (form.cta_whatsapp_enabled && !normalizeWhatsappNumber(form.whatsapp_number)) {
      return "WhatsApp number is required when WhatsApp is enabled.";
    }
    if (form.cta_phone_enabled && !form.garage_phone.trim()) {
      return "Phone number is required when phone callback is enabled.";
    }
    return null;
  }, [form]);

  async function onSave() {
    if (!settings || !form || validationError) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/garage-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garage_name: form.garage_name.trim() || "MOTR",
          cta_booking_enabled: form.cta_booking_enabled,
          cta_whatsapp_enabled: form.cta_whatsapp_enabled,
          cta_phone_enabled: form.cta_phone_enabled,
          whatsapp_number: form.whatsapp_number,
          garage_phone: form.garage_phone.trim(),
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "save_failed");

      const next = body as GarageSettings;
      setSettings(next);
      setForm({
        garage_name: next.garage_name,
        cta_booking_enabled: next.cta_booking_enabled,
        cta_whatsapp_enabled: next.cta_whatsapp_enabled,
        cta_phone_enabled: next.cta_phone_enabled,
        whatsapp_number: next.whatsapp_number,
        garage_phone: next.garage_phone,
      });
      setSuccess("Saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Couldn’t save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] text-[#1C2330]">
      <div className="mx-auto w-full max-w-md px-6 pb-40 pt-6">
        <header className="mb-6 flex items-center justify-between">
          <Link href={backHref} className="text-sm font-medium text-[#657083]">
            Back
          </Link>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Your account</h1>
          <span className="w-10" />
        </header>

        {loading ? (
          <p className="text-sm text-[#657083]">Loading...</p>
        ) : !form ? (
          <p className="text-sm text-[#8E2E2E]">Couldn’t load account settings.</p>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#7B8492]">Garage settings</h2>
              <label className="block">
                <span className="mb-2 block text-base font-semibold text-[#1D2530]">Garage name</span>
                <input
                  value={form.garage_name}
                  onChange={(event) => setForm({ ...form, garage_name: event.target.value })}
                  className="w-full rounded-xl border border-[#E3E8EF] bg-[#FCFDFE] px-3 py-2 text-sm outline-none focus:border-[#B4C0D1]"
                  placeholder="MOTR"
                />
              </label>
            </section>

            <section>
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#7B8492]">Automatic reply options</h2>
              <p className="mt-1 text-sm text-[#7B8492]">
                Decide how your automatic SMS reply appears to customers.
              </p>

              <div className="mt-5 space-y-5">
                <div className="pb-4">
                  <Toggle
                    checked={form.cta_booking_enabled}
                    onChange={(next) => setForm({ ...form, cta_booking_enabled: next })}
                    label="Show online booking"
                  />
                </div>

                <div className="border-t border-[#E8ECF2] pt-5">
                  <Toggle
                    checked={form.cta_whatsapp_enabled}
                    onChange={(next) => setForm({ ...form, cta_whatsapp_enabled: next })}
                    label="Show WhatsApp link"
                  />
                  {form.cta_whatsapp_enabled && (
                    <NumberField
                      label="WhatsApp number"
                      value={form.whatsapp_number}
                      onChange={(next) => setForm({ ...form, whatsapp_number: next })}
                      placeholder="+44 7700 900123"
                    />
                  )}
                </div>

                <div className="border-t border-[#E8ECF2] pt-5">
                  <Toggle
                    checked={form.cta_phone_enabled}
                    onChange={(next) => setForm({ ...form, cta_phone_enabled: next })}
                    label="Include phone number"
                  />
                  {form.cta_phone_enabled && (
                    <NumberField
                      label="Callback phone number"
                      value={form.garage_phone}
                      onChange={(next) => setForm({ ...form, garage_phone: next })}
                      placeholder="+44 7700 900123"
                    />
                  )}
                </div>
              </div>
            </section>

            {(validationError || error || success) && (
              <p
                className={`rounded-xl px-3 py-2 text-sm ${
                  validationError || error
                    ? "border border-[#F2D7D7] bg-[#FFF5F5] text-[#8E2E2E]"
                    : "border border-[#D6ECD9] bg-[#F3FBF4] text-[#20652D]"
                }`}
              >
                {validationError || error || success}
              </p>
            )}
          </div>
        )}
      </div>

      {!loading && !!form && (
        <div
          className="fixed bottom-0 left-0 right-0 border-t border-[#E7EBF1] bg-[#FBFCFE] px-6 pt-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
        >
          <div className="mx-auto w-full max-w-md">
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !!validationError}
              className="w-full rounded-2xl bg-[#1D2530] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
