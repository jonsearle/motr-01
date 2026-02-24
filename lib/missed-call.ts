import type { GarageSettings } from "@/types/db";

const DISPLAY_DOMAIN = "motr.one";
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

export function buildShortLinks(shortCode: string): { booking: string; whatsapp: string } {
  const normalizedCode = shortCode.trim().toLowerCase();
  return {
    booking: `https://${DISPLAY_DOMAIN}/b/${normalizedCode}`,
    whatsapp: `https://${DISPLAY_DOMAIN}/w/${normalizedCode}`,
  };
}

export function buildWhatsappDestination(number: string): string {
  return `https://wa.me/${normalizeWhatsappNumber(number)}?text=${encodeURIComponent(WHATSAPP_TEXT)}`;
}

function resolveCallbackNumber(settings: GarageSettings, fallbackPhone?: string | null): string {
  const primary = normalizePhoneInput(settings.garage_phone);
  if (primary) return primary;
  return normalizePhoneInput(fallbackPhone ?? "");
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
