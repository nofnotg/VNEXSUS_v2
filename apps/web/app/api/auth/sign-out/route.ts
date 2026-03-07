import { NextResponse } from "next/server";
import { createApiSuccess } from "@vnexus/shared";

const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "vnexus_session";

export async function POST() {
  const response = NextResponse.json(
    createApiSuccess({
      signedOut: true
    })
  );

  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/"
  });

  return response;
}
