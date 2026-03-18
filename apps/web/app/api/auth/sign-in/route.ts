import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiError, createApiSuccess } from "@vnexus/shared";
import { prisma } from "../../../../lib/prisma";
import { verifyPassword } from "../../../../lib/server/auth/password";

const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "vnexus_session";
const ADMIN_EMAIL = "nofnotg@gmail.com";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = signInSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(createApiError("VALIDATION_ERROR", "Invalid sign-in payload"), {
      status: 400
    });
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      passwordHash: true
    }
  });

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json(createApiError("UNAUTHORIZED", "이메일 또는 비밀번호가 올바르지 않습니다."), {
      status: 401
    });
  }

  if (user.status !== "active" && normalizedEmail !== ADMIN_EMAIL) {
    const message =
      user.status === "pending"
        ? "승인 대기 중인 계정입니다."
        : "접속이 제한된 계정입니다. 관리자에게 문의해 주세요.";

    return NextResponse.json(createApiError("FORBIDDEN", message), {
      status: 403
    });
  }

  const sessionUser = {
    id: user.id,
    email: user.email,
    role: normalizedEmail === ADMIN_EMAIL ? "admin" : user.role,
    status: normalizedEmail === ADMIN_EMAIL ? "active" : user.status
  } as const;

  const response = NextResponse.json(
    createApiSuccess({
      user: sessionUser
    })
  );

  response.cookies.set(sessionCookieName, Buffer.from(JSON.stringify(sessionUser)).toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return response;
}
