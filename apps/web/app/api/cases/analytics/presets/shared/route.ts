import { ApiError } from "@vnexus/shared";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../../../lib/server/api";
import { getSharedPresets } from "../../../../../../lib/server/services/analytics-preset-service";

function assertAnalyticsRole(role: string) {
  if (!["investigator", "admin"].includes(role)) {
    throw new ApiError("FORBIDDEN", "Case analytics is not available for this role");
  }
}

export async function GET() {
  try {
    const { user } = await requireAuthorizedSession();
    assertAnalyticsRole(user.role);
    const presets = await getSharedPresets(user.id);
    return apiSuccess({ items: presets });
  } catch (error) {
    return apiFailure(error);
  }
}
