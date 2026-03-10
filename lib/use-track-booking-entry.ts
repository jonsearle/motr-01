"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { TrackingEventType } from "@/types/db";

function mapSourceToEvent(source: string | null): TrackingEventType | null {
  if (!source) return null;

  const normalized = source.trim().toLowerCase();
  if (normalized === "website") return "entry_website";
  if (normalized === "gmb_booking" || normalized === "book_online" || normalized === "booking") {
    return "entry_gmb_booking";
  }

  return null;
}

export function useTrackBookingEntry(): void {
  const searchParams = useSearchParams();
  const source = searchParams.get("src");
  const eventType = mapSourceToEvent(source);

  useEffect(() => {
    if (!eventType) return;

    const dedupeKey = `tracked-entry:${eventType}:${source ?? ""}`;
    if (typeof window !== "undefined" && window.sessionStorage.getItem(dedupeKey) === "1") {
      return;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(dedupeKey, "1");
    }

    void fetch("/api/tracking/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: eventType }),
    }).catch(() => {
      // Best-effort tracking.
    });
  }, [eventType, source]);
}
