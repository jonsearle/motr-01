import { NextRequest, NextResponse } from "next/server";
import { getGarageSettingsByShortCode } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  try {
    const settings = await getGarageSettingsByShortCode(params.code);
    const target = settings?.google_review_url?.trim();

    if (!target) {
      return NextResponse.redirect(new URL("/book", request.url));
    }

    return NextResponse.redirect(target);
  } catch {
    return NextResponse.redirect(new URL("/book", request.url));
  }
}
