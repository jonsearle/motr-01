import { NextRequest, NextResponse } from "next/server";
import { deleteBooking } from "@/lib/db";
import { getMotorHqSessionToken, MOTORHQ_AUTH_COOKIE } from "@/lib/motorhq-auth";
import { getOwnerSessionToken, OWNER_AUTH_COOKIE } from "@/lib/owner-auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const motorHqCookie = request.cookies.get(MOTORHQ_AUTH_COOKIE)?.value;
  const ownerCookie = request.cookies.get(OWNER_AUTH_COOKIE)?.value;
  const authorized = motorHqCookie === getMotorHqSessionToken() || ownerCookie === getOwnerSessionToken();
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!params?.id) {
      return NextResponse.json({ error: "Booking id is required" }, { status: 400 });
    }

    await deleteBooking(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete booking", error);
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
  }
}
