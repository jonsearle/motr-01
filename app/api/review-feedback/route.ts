import { NextRequest, NextResponse } from "next/server";
import { createReviewFeedback, getGarageSettingsByShortCode } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      short_code?: string;
      rating?: number;
      message?: string;
      customer_phone?: string;
    };

    const shortCode = body.short_code?.trim().toLowerCase();
    const rating = body.rating;
    const message = body.message?.trim() ?? "";

    if (!shortCode) {
      return NextResponse.json({ error: "Short code is required" }, { status: 400 });
    }
    if (!Number.isInteger(rating) || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1 to 5" }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "Feedback message is required" }, { status: 400 });
    }

    const settings = await getGarageSettingsByShortCode(shortCode);
    if (!settings) {
      return NextResponse.json({ error: "Garage not found" }, { status: 404 });
    }

    await createReviewFeedback({
      garage_id: settings.id,
      rating,
      message,
      customer_phone: body.customer_phone?.trim() || null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
