import { NextRequest, NextResponse } from "next/server";
import { createApiError, createApiSuccess, sessionUserSchema } from "@vnexus/shared";

const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "vnexus_session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = sessionUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(createApiError("VALIDATION_ERROR", "Invalid sign-in payload"), {
      status: 400
    });
  }

  const response = NextResponse.json(
    createApiSuccess({
      user: parsed.data
    })
  );

  response.cookies.set(sessionCookieName, Buffer.from(JSON.stringify(parsed.data)).toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return response;
}
