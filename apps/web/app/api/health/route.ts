import { NextResponse } from "next/server";
import { createApiSuccess } from "@vnexus/shared";

export async function GET() {
  return NextResponse.json(
    createApiSuccess({
      status: "ok",
      timestamp: new Date().toISOString()
    })
  );
}
