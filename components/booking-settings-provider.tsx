"use client";

import { createContext, useContext } from "react";
import type { GarageSettings } from "@/types/db";

const BookingSettingsContext = createContext<GarageSettings | null>(null);

export function BookingSettingsProvider({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: GarageSettings;
}) {
  return <BookingSettingsContext.Provider value={settings}>{children}</BookingSettingsContext.Provider>;
}

export function useOptionalBookingSettings(): GarageSettings | null {
  return useContext(BookingSettingsContext);
}

export function useBookingSettings(): GarageSettings {
  const settings = useOptionalBookingSettings();

  if (!settings) {
    throw new Error("useBookingSettings must be used within BookingSettingsProvider.");
  }

  return settings;
}
