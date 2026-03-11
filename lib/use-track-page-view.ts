"use client";

import { useEffect } from "react";
import type { TrackingEventType } from "@/types/db";

export function useTrackPageView(eventType: TrackingEventType, options?: { dedupeInSession?: boolean }): void {
  const dedupeInSession = options?.dedupeInSession ?? true;

  useEffect(() => {
    if (dedupeInSession && typeof window !== "undefined") {
      const dedupeKey = `tracked-page-view:${eventType}`;
      if (window.sessionStorage.getItem(dedupeKey) === "1") {
        return;
      }
      window.sessionStorage.setItem(dedupeKey, "1");
    }

    void fetch("/api/tracking/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: eventType }),
    }).catch(() => {
      // Best-effort tracking.
    });
  }, [eventType, dedupeInSession]);
}
