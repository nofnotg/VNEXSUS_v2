import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiError, createApiSuccess, userRoles } from "@vnexus/shared";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(userRoles)
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = signUpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(createApiError("VALIDATION_ERROR", "Invalid sign-up payload"), {
      status: 400
    });
  }

  return NextResponse.json(
    createApiSuccess({
      message: "Auth skeleton only. User persistence is not wired in Epic 0.",
      requestedRole: parsed.data.role
    }),
    { status: 202 }
  );
}
