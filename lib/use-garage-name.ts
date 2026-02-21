"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "motr_garage_name";
let cachedGarageName: string | null = null;

export function useGarageName(fallback = "MOTR Garage"): string {
  const [garageName, setGarageName] = useState<string>(() => {
    if (cachedGarageName) return cachedGarageName;

    if (typeof window !== "undefined") {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored?.trim()) {
        cachedGarageName = stored.trim();
        return cachedGarageName;
      }
    }

    return fallback;
  });

  useEffect(() => {
    let mounted = true;

    async function loadGarageName() {
      try {
        const response = await fetch("/api/garage-settings", { cache: "no-store" });
        if (!response.ok) return;

        const body = (await response.json()) as { garage_name?: string };
        const nextName = body.garage_name?.trim();
        if (!nextName || !mounted) return;

        cachedGarageName = nextName;
        setGarageName(nextName);
        window.sessionStorage.setItem(STORAGE_KEY, nextName);
      } catch {
        // Keep existing fallback/cached name.
      }
    }

    loadGarageName();
    return () => {
      mounted = false;
    };
  }, []);

  return garageName;
}
