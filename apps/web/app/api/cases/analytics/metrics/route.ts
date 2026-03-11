import { ApiError } from "@vnexus/shared";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../../lib/server/api";
import {
  formatAnalyticsMetricsPrometheus,
  getAnalyticsMetricsSnapshot,
  getAnalyticsObservabilityConfig
} from "../../../../../lib/server/analytics-observability";
import { getPresetCacheStatsSnapshot } from "../../../../../lib/server/services/analytics-preset-cache";

export async function GET(request: Request) {
  try {
    const { user } = await requireAuthorizedSession();

    if (user.role !== "admin") {
      throw new ApiError("FORBIDDEN", "Only admins can view analytics metrics");
    }

    const format = new URL(request.url).searchParams.get("format");
    if (format === "prometheus") {
      return new Response(formatAnalyticsMetricsPrometheus(), {
        status: 200,
        headers: {
          "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
          "Cache-Control": "no-store"
        }
      });
    }

    return apiSuccess({
      metrics: getAnalyticsMetricsSnapshot(),
      cache: getPresetCacheStatsSnapshot(),
      config: getAnalyticsObservabilityConfig()
    });
  } catch (error) {
    return apiFailure(error);
  }
}
