import { ApiError } from "@vnexus/shared";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../lib/server/api";
import { getCaseAnalytics } from "../../../../lib/server/services/case-analytics-service";

export async function GET() {
  try {
    const { user } = await requireAuthorizedSession();

    if (!["investigator", "admin"].includes(user.role)) {
      throw new ApiError("FORBIDDEN", "Case analytics is not available for this role");
    }

    const analytics = await getCaseAnalytics(user.id, user.role);
    return apiSuccess(analytics);
  } catch (error) {
    return apiFailure(error);
  }
}
