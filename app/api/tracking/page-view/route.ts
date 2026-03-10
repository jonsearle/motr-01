import { NextRequest, NextResponse } from "next/server";
import { getOrCreateGarageSettings, logTrackingEvent } from "@/lib/db";
import type { TrackingEventType } from "@/types/db";

const PAGE_VIEW_EVENTS = new Set<TrackingEventType>([
  "page_view_book",
  "page_view_date_time",
  "page_view_mobile",
  "page_view_confirmation",
  "page_view_custom_job",
  "page_view_not_sure",
  "page_view_not_sure_details",
]);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { event_type?: TrackingEventType };

    if (!body.event_type || !PAGE_VIEW_EVENTS.has(body.event_type)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }

    const settings = await getOrCreateGarageSettings();
    await logTrackingEvent({
      garage_id: settings.id,
      event_type: body.event_type,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to track page view", error);
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}
