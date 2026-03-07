import { NextRequest, NextResponse } from "next/server";
import { ZodType, z } from "zod";
import { createApiError, createApiSuccess, ApiError } from "@vnexus/shared";
import { requireSessionRecord } from "./session-user";

export async function parseJsonBody<T>(request: NextRequest, schema: ZodType<T>) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError("VALIDATION_ERROR", "Invalid request body", {
      issues: z.treeifyError(parsed.error)
    });
  }

  return parsed.data;
}

export async function requireAuthorizedSession() {
  const session = await requireSessionRecord();
  if (!session) {
    throw new ApiError("UNAUTHORIZED", "No active session");
  }
  return session;
}

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(createApiSuccess(data), init);
}

export function apiFailure(error: unknown) {
  if (error instanceof ApiError) {
    const status =
      error.code === "UNAUTHORIZED"
        ? 401
        : error.code === "FORBIDDEN"
          ? 403
          : error.code === "NOT_FOUND"
            ? 404
            : error.code === "CONFLICT"
              ? 409
              : error.code === "NOT_READY"
                ? 503
                : 400;

    return NextResponse.json(createApiError(error.code, error.message, error.details), { status });
  }

  return NextResponse.json(createApiError("INTERNAL_ERROR", "Unexpected server error"), {
    status: 500
  });
}
