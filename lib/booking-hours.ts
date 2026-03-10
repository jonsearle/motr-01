export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export interface DayHours {
  enabled: boolean;
  startHour: number;
  endHour: number;
}

export type OpeningHours = Record<DayKey, DayHours>;

export const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const DEFAULT_OPENING_HOURS: OpeningHours = {
  sun: { enabled: false, startHour: 9, endHour: 17 },
  mon: { enabled: true, startHour: 8, endHour: 18 },
  tue: { enabled: true, startHour: 8, endHour: 18 },
  wed: { enabled: true, startHour: 8, endHour: 18 },
  thu: { enabled: true, startHour: 8, endHour: 18 },
  fri: { enabled: true, startHour: 8, endHour: 18 },
  sat: { enabled: true, startHour: 8, endHour: 14 },
};

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeHour(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) return fallback;
  return Math.min(23, Math.max(0, value));
}

function normalizeDayHours(input: unknown, fallback: DayHours): DayHours {
  if (!isObject(input)) return fallback;

  const enabled = typeof input.enabled === "boolean" ? input.enabled : fallback.enabled;
  let startHour = normalizeHour(input.startHour, fallback.startHour);
  let endHour = normalizeHour(input.endHour, fallback.endHour);

  if (endHour <= startHour) {
    endHour = Math.min(23, startHour + 1);
    if (endHour <= startHour) {
      startHour = Math.max(0, endHour - 1);
    }
  }

  return { enabled, startHour, endHour };
}

export function normalizeOpeningHours(input: unknown): OpeningHours {
  const source = isObject(input) ? input : {};
  return {
    sun: normalizeDayHours(source.sun, DEFAULT_OPENING_HOURS.sun),
    mon: normalizeDayHours(source.mon, DEFAULT_OPENING_HOURS.mon),
    tue: normalizeDayHours(source.tue, DEFAULT_OPENING_HOURS.tue),
    wed: normalizeDayHours(source.wed, DEFAULT_OPENING_HOURS.wed),
    thu: normalizeDayHours(source.thu, DEFAULT_OPENING_HOURS.thu),
    fri: normalizeDayHours(source.fri, DEFAULT_OPENING_HOURS.fri),
    sat: normalizeDayHours(source.sat, DEFAULT_OPENING_HOURS.sat),
  };
}

export function assertValidOpeningHours(input: unknown): OpeningHours {
  const normalized = normalizeOpeningHours(input);
  const hasOpenDay = DAY_KEYS.some((key) => normalized[key].enabled);

  if (!hasOpenDay) {
    throw new Error("At least one day must be open for online booking hours.");
  }

  for (const key of DAY_KEYS) {
    const day = normalized[key];
    if (day.endHour <= day.startHour) {
      throw new Error(`Invalid hours for ${key}. End hour must be after start hour.`);
    }
  }

  return normalized;
}

export function dayKeyFromDate(date: Date): DayKey {
  return DAY_KEYS[date.getDay()];
}

export function buildTimeSlotsForDate(date: Date, openingHours: OpeningHours): string[] {
  const key = dayKeyFromDate(date);
  const day = openingHours[key];

  if (!day.enabled) return [];

  const slots: string[] = [];
  for (let hour = day.startHour; hour < day.endHour; hour += 1) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
  }
  return slots;
}

export function isDateBookable(date: Date, openingHours: OpeningHours): boolean {
  return buildTimeSlotsForDate(date, openingHours).length > 0;
}

export function findFirstBookableDate(startDate: Date, openingHours: OpeningHours, searchDays = 365): Date {
  for (let i = 0; i <= searchDays; i += 1) {
    const candidate = new Date(startDate);
    candidate.setDate(startDate.getDate() + i);
    if (isDateBookable(candidate, openingHours)) {
      return candidate;
    }
  }

  return new Date(startDate);
}
