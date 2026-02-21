import { NextResponse } from "next/server";
import { deleteBooking } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
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
