import { ApiError } from "@vnexus/shared";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../../lib/server/api";
import { parseCaseAnalyticsFilter, parseTrendInterval } from "../../../../../lib/server/case-analytics-query";
import { getCaseAnalyticsTrend } from "../../../../../lib/server/services/case-analytics-service";

export async function GET(request: Request) {
  try {
    const { user } = await requireAuthorizedSession();

    if (!["investigator", "admin"].includes(user.role)) {
      throw new ApiError("FORBIDDEN", "Case analytics is not available for this role");
    }

    const searchParams = new URL(request.url).searchParams;
    const filter = parseCaseAnalyticsFilter(searchParams);
    const interval = parseTrendInterval(searchParams);
    const trend = await getCaseAnalyticsTrend(user.id, user.role, filter, interval);
    return apiSuccess(trend);
  } catch (error) {
    return apiFailure(error);
  }
}
