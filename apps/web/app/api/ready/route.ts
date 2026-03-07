import { NextResponse } from "next/server";
import { createApiSuccess, loadAppEnv } from "@vnexus/shared";

export async function GET() {
  const envResult = loadAppEnv();
  const ready = envResult.ok;

  return NextResponse.json(
    createApiSuccess({
      status: ready ? "ready" : "not_ready",
      checks: {
        envSchemaValid: ready,
        databaseUrl: Boolean(process.env.DATABASE_URL),
        redisUrl: Boolean(process.env.REDIS_URL),
        authSecret: Boolean(process.env.AUTH_SECRET)
      },
      issues: envResult.ok ? [] : envResult.issues
    }),
    { status: ready ? 200 : 503 }
  );
}
