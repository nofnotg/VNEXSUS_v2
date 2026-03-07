import { NextResponse } from "next/server";
import { createApiError, createApiSuccess } from "@vnexus/shared";
import { getSessionUser } from "../../../../lib/session";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(createApiError("UNAUTHORIZED", "No active session"), { status: 401 });
  }

  return NextResponse.json(
    createApiSuccess({
      user
    })
  );
}
