import { NextResponse } from "next/server";
import { createApiSuccess } from "@vnexus/shared";

export async function GET() {
  const required = {
    databaseUrl: Boolean(process.env.DATABASE_URL),
    redisUrl: Boolean(process.env.REDIS_URL),
    authSecret: Boolean(process.env.AUTH_SECRET)
  };

  const ready = Object.values(required).every(Boolean);

  return NextResponse.json(
    createApiSuccess({
      status: ready ? "ready" : "not_ready",
      checks: required
    }),
    { status: ready ? 200 : 503 }
  );
}
