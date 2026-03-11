import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMotorHqSessionToken, MOTORHQ_AUTH_COOKIE } from "@/lib/motorhq-auth";
import { getOwnerSessionToken, OWNER_AUTH_COOKIE } from "@/lib/owner-auth";

function isMotorHqPage(pathname: string): boolean {
  return pathname === "/motorhq" || pathname.startsWith("/motorhq/");
}

function isProtectedMotorHqApi(pathname: string): boolean {
  return pathname.startsWith("/api/motorhq") && pathname !== "/api/motorhq/auth";
}

function isOwnerPage(pathname: string): boolean {
  return pathname === "/" || pathname === "/bookings" || pathname === "/account" || pathname.startsWith("/account/");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const motorHqTarget = isMotorHqPage(pathname) || isProtectedMotorHqApi(pathname);
  const ownerTarget = isOwnerPage(pathname);

  if (!motorHqTarget && !ownerTarget) {
    return NextResponse.next();
  }

  if (pathname === "/motorhq/login") {
    return NextResponse.next();
  }
  if (pathname === "/owner/login") {
    return NextResponse.next();
  }

  const motorHqCookie = request.cookies.get(MOTORHQ_AUTH_COOKIE)?.value;
  const ownerCookie = request.cookies.get(OWNER_AUTH_COOKIE)?.value;
  const motorHqAuthorized = motorHqCookie === getMotorHqSessionToken();
  const ownerAuthorized = ownerCookie === getOwnerSessionToken() || motorHqAuthorized;

  if ((motorHqTarget && motorHqAuthorized) || (ownerTarget && ownerAuthorized)) {
    return NextResponse.next();
  }

  if (isProtectedMotorHqApi(pathname)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (motorHqTarget) {
    const loginUrl = new URL("/motorhq/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const ownerLoginUrl = new URL("/owner/login", request.url);
  ownerLoginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(ownerLoginUrl);
}

export const config = {
  matcher: ["/", "/bookings", "/account", "/account/:path*", "/owner/:path*", "/motorhq/:path*", "/api/motorhq/:path*"],
};
