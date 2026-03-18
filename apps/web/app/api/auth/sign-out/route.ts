import { NextResponse } from "next/server";
import { createApiSuccess } from "@vnexus/shared";

const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "vnexus_session";

export async function POST() {
  const response = NextResponse.json(createApiSuccess({ success: true }));
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}
