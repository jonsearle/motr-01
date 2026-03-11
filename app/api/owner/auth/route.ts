import { NextRequest, NextResponse } from "next/server";
import { getOwnerPasscode, getOwnerSessionToken, OWNER_AUTH_COOKIE } from "@/lib/owner-auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { passcode?: string };
    const passcode = typeof body.passcode === "string" ? body.passcode.trim() : "";

    if (!passcode || passcode !== getOwnerPasscode()) {
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(OWNER_AUTH_COOKIE, getOwnerSessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    console.error("Failed to authenticate owner", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(OWNER_AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
