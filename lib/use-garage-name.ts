"use client";

import { useOptionalBookingSettings } from "@/components/booking-settings-provider";

const DEFAULT_GARAGE_NAME = "N1 Mobile Auto Repairs";

export function useGarageName(): string {
  const settings = useOptionalBookingSettings();
  return settings?.garage_name?.trim() || DEFAULT_GARAGE_NAME;
}
