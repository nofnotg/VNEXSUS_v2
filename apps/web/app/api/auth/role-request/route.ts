import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiError, createApiSuccess } from "@vnexus/shared";

const roleRequestSchema = z.object({
  targetRole: z.literal("investigator"),
  organizationName: z.string().min(1).optional(),
  note: z.string().min(1).optional()
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = roleRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(createApiError("VALIDATION_ERROR", "Invalid role request payload"), {
      status: 400
    });
  }

  return NextResponse.json(
    createApiSuccess({
      status: "pending",
      targetRole: parsed.data.targetRole
    }),
    { status: 202 }
  );
}
