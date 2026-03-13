import type { GarageSettings } from "@/types/db";

const DEFAULT_APP_BASE_URL = "https://motr.one";
const WHATSAPP_TEXT = "Hi there, I'm looking for some help.";

export function normalizePhoneInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const compact = trimmed.replace(/[()\-\s]/g, "");
  if (compact.startsWith("+")) return `+${compact.slice(1).replace(/\D/g, "")}`;
  if (compact.startsWith("00")) return `+${compact.slice(2).replace(/\D/g, "")}`;
  return compact.replace(/\D/g, "");
}

export function normalizeWhatsappNumber(input: string): string {
  return normalizePhoneInput(input).replace(/\D/g, "");
}

export function isLikelyValidPhone(input: string): boolean {
  const raw = input.trim();
  if (!raw) return false;

  // Local format only for now. International prefix (+44 / 0044) is treated as invalid.
  if (raw.includes("+") || raw.startsWith("00")) return false;

  // Allow common separators while typing.
  if (!/^[\d\s()-]+$/.test(raw)) return false;

  const digits = normalizePhoneInput(raw).replace(/\D/g, "");

  // UK local numbers are typically 11 digits and start with 0.
  if (!/^0\d{10}$/.test(digits)) return false;

  // Reject obvious junk like all zeros.
  if (/^0+$/.test(digits)) return false;

  return true;
}

export function buildShortLinks(shortCode: string): { booking: string; whatsapp: string } {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_BASE_URL || process.env.BASE_APP_URL || DEFAULT_APP_BASE_URL).replace(/\/$/, "");
  const normalizedCode = shortCode.trim().toLowerCase();
  return {
    booking: `${baseUrl}/b/${normalizedCode}`,
    whatsapp: `${baseUrl}/w/${normalizedCode}`,
  };
}

export function buildWhatsappDestination(number: string): string {
  return `https://wa.me/${normalizeWhatsappNumber(number)}?text=${encodeURIComponent(WHATSAPP_TEXT)}`;
}

function resolveCallbackNumber(settings: GarageSettings, fallbackPhone?: string | null): string {
  const primary = normalizePhoneInput(settings.booking_alert_phone);
  if (primary) return primary;
  const legacyGaragePhone = normalizePhoneInput(settings.garage_phone);
  if (legacyGaragePhone) return legacyGaragePhone;
  return normalizePhoneInput(fallbackPhone ?? "");
}

export function resolveGarageContactNumber(settings: GarageSettings, fallbackPhone?: string | null): string {
  return resolveCallbackNumber(settings, fallbackPhone);
}

export function validateMissedCallCtas(settings: GarageSettings, fallbackPhone?: string | null): string | null {
  const enabledCount = Number(settings.cta_booking_enabled) + Number(settings.cta_whatsapp_enabled) + 1;

  if (enabledCount < 1) return "At least one CTA must be enabled.";
  if (settings.cta_whatsapp_enabled && !normalizeWhatsappNumber(settings.whatsapp_number)) {
    return "WhatsApp CTA is enabled but WhatsApp number is missing.";
  }
  if (!resolveCallbackNumber(settings, fallbackPhone)) {
    return "Phone CTA is enabled but callback number is missing.";
  }
  return null;
}

export function composeMissedCallSms(settings: GarageSettings, fallbackPhone?: string | null): string {
  const lines = ["Jon's Garage:", "Sorry we missed your call.", ""];
  const links = buildShortLinks(settings.short_code);
  const ctas: string[] = [];

  if (settings.cta_booking_enabled) {
    ctas.push(`Book online:\n${links.booking}`);
  }
  if (settings.cta_whatsapp_enabled) {
    ctas.push(`Send WhatsApp:\n${links.whatsapp}`);
  }
  ctas.push(`Call us:\n${resolveCallbackNumber(settings, fallbackPhone)}`);

  lines.push(ctas.join("\n\n"));
  return lines.join("\n");
}
