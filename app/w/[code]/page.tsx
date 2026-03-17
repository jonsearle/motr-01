import { redirect } from "next/navigation";
import { getGarageSettingsByShortCode, logTrackingEvent } from "@/lib/db";
import { buildWhatsappDestination, resolveWhatsappNumber } from "@/lib/missed-call";

export const dynamic = "force-dynamic";

export default async function WhatsappShortLinkPage({
  params,
}: {
  params: { code: string };
}) {
  let target = "/book";

  try {
    const settings = await getGarageSettingsByShortCode(params.code);
    const number = settings ? resolveWhatsappNumber(settings) : "";

    if (settings) {
      try {
        await logTrackingEvent({
          garage_id: settings.id,
          event_type: "whatsapp_click",
        });
      } catch (trackingError) {
        console.error("Failed to log whatsapp_click", trackingError);
      }
    }

    if (number) {
      target = buildWhatsappDestination(number);
    }
  } catch (error) {
    console.error("WhatsApp redirect failed", error);
  }

  redirect(target);
}
