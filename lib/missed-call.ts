import type { GarageSettings } from "@/types/db";

const DISPLAY_DOMAIN = "motr.one";
const WHATSAPP_TEXT = "Hi I just called about my car (Motr)";

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

export function validateMissedCallCtas(settings: GarageSettings): string | null {
  const enabledCount =
    Number(settings.cta_booking_enabled) +
    Number(settings.cta_whatsapp_enabled) +
    Number(settings.cta_phone_enabled);

  if (enabledCount < 1) return "At least one CTA must be enabled.";
  if (settings.cta_whatsapp_enabled && !normalizeWhatsappNumber(settings.whatsapp_number)) {
    return "WhatsApp CTA is enabled but WhatsApp number is missing.";
  }
  if (settings.cta_phone_enabled && !settings.garage_phone.trim()) {
    return "Phone CTA is enabled but callback number is missing.";
  }
  return null;
}

export function composeMissedCallSms(settings: GarageSettings): string {
  const lines = [settings.garage_name.trim() || "MOTR", "Sorry we missed your call.", ""];
  const links = buildShortLinks(settings.short_code);

  if (settings.cta_booking_enabled) {
    lines.push(`BOOK ONLINE: ${links.booking}`);
  }
  if (settings.cta_whatsapp_enabled) {
    lines.push(`SEND WHATSAPP: ${links.whatsapp}`);
  }
  if (settings.cta_phone_enabled) {
    lines.push(`CALL US: ${settings.garage_phone.trim()}`);
  }

  return lines.join("\n");
}
