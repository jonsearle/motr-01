import { NextResponse } from "next/server";
import { getGarageSettingsByShortCode } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { code: string } }) {
  try {
    const settings = await getGarageSettingsByShortCode(params.code);
    if (!settings) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      garage_name: settings.garage_name,
      google_review_url: settings.google_review_url,
      short_code: settings.short_code,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load review details" }, { status: 500 });
  }
}
