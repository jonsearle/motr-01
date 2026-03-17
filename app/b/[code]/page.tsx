import { redirect } from "next/navigation";
import { getGarageSettingsByShortCode, logTrackingEvent } from "@/lib/db";

export const dynamic = "force-dynamic";

function buildBookingTarget(searchParams: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }

    if (typeof value === "string") {
      params.set(key, value);
    }
  }

  if (!params.get("src")) {
    params.set("src", "gmb_booking");
  }

  const query = params.toString();
  return query ? `/book?${query}` : "/book";
}

export default async function BookingShortLinkPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  try {
    const settings = await getGarageSettingsByShortCode(params.code);
    if (settings) {
      try {
        await logTrackingEvent({
          garage_id: settings.id,
          event_type: "booking_click",
        });
      } catch (trackingError) {
        console.error("Failed to log booking_click", trackingError);
      }
    }
  } catch (error) {
    console.error("Booking redirect failed", error);
  }

  redirect(buildBookingTarget(searchParams));
}
