import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/dashboard/consumer", "/dashboard/investigator", "/dashboard/admin"];
const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "vnexus_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(sessionCookieName)?.value;

  if (!sessionCookie) {
    const redirectUrl = new URL("/sign-in", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
