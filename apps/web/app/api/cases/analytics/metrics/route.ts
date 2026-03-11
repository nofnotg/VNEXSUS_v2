import { ApiError } from "@vnexus/shared";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../../lib/server/api";
import { getAnalyticsMetricsSnapshot } from "../../../../../lib/server/analytics-observability";

export async function GET() {
  try {
    const { user } = await requireAuthorizedSession();

    if (user.role !== "admin") {
      throw new ApiError("FORBIDDEN", "Only admins can view analytics metrics");
    }

    return apiSuccess(getAnalyticsMetricsSnapshot());
  } catch (error) {
    return apiFailure(error);
  }
}
