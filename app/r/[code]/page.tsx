import { redirect } from "next/navigation";
import { getGarageSettingsByShortCode } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReviewShortLinkPage({
  params,
}: {
  params: { code: string };
}) {
  try {
    const settings = await getGarageSettingsByShortCode(params.code);
    const target = settings?.google_review_url?.trim();

    if (target) {
      redirect(target);
    }
  } catch {
    // Fall through to booking page below.
  }

  redirect("/book");
}
