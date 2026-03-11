import { ApiError } from "@vnexus/shared";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../../../../lib/server/api";
import { searchShareCandidates } from "../../../../../../../lib/server/services/analytics-preset-service";

function assertAnalyticsRole(role: string) {
  if (!["investigator", "admin"].includes(role)) {
    throw new ApiError("FORBIDDEN", "Case analytics is not available for this role");
  }
}

export async function GET(request: Request) {
  try {
    const { user } = await requireAuthorizedSession();
    assertAnalyticsRole(user.role);
    const query = new URL(request.url).searchParams.get("q") ?? "";
    const items = await searchShareCandidates(user.id, query);
    return apiSuccess({ items });
  } catch (error) {
    return apiFailure(error);
  }
}
