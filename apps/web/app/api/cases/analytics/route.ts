import { ApiError } from "@vnexus/shared";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../lib/server/api";
import { parseCaseAnalyticsFilter } from "../../../../lib/server/case-analytics-query";
import { getCaseAnalytics } from "../../../../lib/server/services/case-analytics-service";

export async function GET(request: Request) {
  try {
    const { user } = await requireAuthorizedSession();

    if (!["investigator", "admin"].includes(user.role)) {
      throw new ApiError("FORBIDDEN", "Case analytics is not available for this role");
    }

    const filter = parseCaseAnalyticsFilter(new URL(request.url).searchParams);
    const analytics = await getCaseAnalytics(user.id, user.role, filter);
    return apiSuccess(analytics);
  } catch (error) {
    return apiFailure(error);
  }
}
