"use client";

import { useEffect } from "react";
import type { TrackingEventType } from "@/types/db";

export function useTrackPageView(eventType: TrackingEventType): void {
  useEffect(() => {
    void fetch("/api/tracking/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: eventType }),
    }).catch(() => {
      // Best-effort tracking.
    });
  }, [eventType]);
}
