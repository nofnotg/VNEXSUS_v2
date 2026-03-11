import { ApiError, analyticsExportSchema } from "@vnexus/shared";
import { apiFailure, parseJsonBody, requireAuthorizedSession } from "../../../../../lib/server/api";
import { parseAnalyticsExportQuery } from "../../../../../lib/server/case-analytics-query";
import { exportAnalytics } from "../../../../../lib/server/services/case-analytics-service";
import { Readable } from "node:stream";

function assertAnalyticsRole(role: string) {
  if (!["investigator", "admin"].includes(role)) {
    throw new ApiError("FORBIDDEN", "Case analytics is not available for this role");
  }
}

function buildFileResponse(file: Awaited<ReturnType<typeof exportAnalytics>>) {
  return new Response(Readable.toWeb(file.stream) as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Content-Length": `${file.size}`,
      "Cache-Control": "no-store"
    }
  });
}

export async function GET(request: Request) {
  try {
    const { user } = await requireAuthorizedSession();
    assertAnalyticsRole(user.role);
    const input = parseAnalyticsExportQuery(new URL(request.url).searchParams);
    const file = await exportAnalytics(user.id, user.role, input.filter, input.interval, input.fileType);
    return buildFileResponse(file);
  } catch (error) {
    return apiFailure(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAuthorizedSession();
    assertAnalyticsRole(user.role);
    const input = await parseJsonBody(request as never, analyticsExportSchema);
    const file = await exportAnalytics(user.id, user.role, input.filter, input.interval, input.fileType);
    return buildFileResponse(file);
  } catch (error) {
    return apiFailure(error);
  }
}
