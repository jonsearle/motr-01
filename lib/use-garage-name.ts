"use client";

import { useEffect, useState } from "react";
import type { GarageSettings } from "@/types/db";

const DEFAULT_GARAGE_NAME = "N1 Mobile Auto Repairs";

export function useGarageName(): string {
  const [garageName, setGarageName] = useState(DEFAULT_GARAGE_NAME);

  useEffect(() => {
    let mounted = true;

    async function loadGarageName() {
      try {
        const response = await fetch(`/api/garage-settings?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) return;
        const settings = (await response.json()) as GarageSettings;
        if (!mounted) return;
        if (settings.garage_name?.trim()) {
          setGarageName(settings.garage_name.trim());
        }
      } catch {
        // Keep default name.
      }
    }

    loadGarageName();

    return () => {
      mounted = false;
    };
  }, []);

  return garageName;
}
