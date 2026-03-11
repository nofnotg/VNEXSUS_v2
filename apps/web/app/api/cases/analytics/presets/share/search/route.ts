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
    const searchParams = new URL(request.url).searchParams;
    const query = searchParams.get("q") ?? "";
    const page = Number(searchParams.get("page") ?? "1");
    const result = await searchShareCandidates(user.id, query, page);
    return apiSuccess(result);
  } catch (error) {
    return apiFailure(error);
  }
}
