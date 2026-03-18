import { NextRequest, NextResponse } from "next/server";
import { createApiError, createApiSuccess } from "@vnexus/shared";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json(createApiError("VALIDATION_ERROR", "Email is required"), {
      status: 400
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      email
    },
    select: {
      id: true
    }
  });

  return NextResponse.json(
    createApiSuccess({
      available: !user
    })
  );
}
