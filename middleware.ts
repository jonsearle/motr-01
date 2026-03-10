import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMotorHqSessionToken, MOTORHQ_AUTH_COOKIE } from "@/lib/motorhq-auth";

function isMotorHqPage(pathname: string): boolean {
  return pathname === "/motorhq" || pathname.startsWith("/motorhq/");
}

function isProtectedMotorHqApi(pathname: string): boolean {
  return pathname.startsWith("/api/motorhq") && pathname !== "/api/motorhq/auth";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isMotorHqPage(pathname) && !isProtectedMotorHqApi(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/motorhq/login") {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(MOTORHQ_AUTH_COOKIE)?.value;
  const authorized = authCookie === getMotorHqSessionToken();

  if (authorized) {
    return NextResponse.next();
  }

  if (isProtectedMotorHqApi(pathname)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/motorhq/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/motorhq/:path*", "/api/motorhq/:path*"],
};
