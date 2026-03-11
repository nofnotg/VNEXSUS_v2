import { ApiError, analyticsPresetShareSchema } from "@vnexus/shared";
import { apiFailure, apiSuccess, parseJsonBody, requireAuthorizedSession } from "../../../../../../lib/server/api";
import { sharePreset } from "../../../../../../lib/server/services/analytics-preset-service";

function assertAnalyticsRole(role: string) {
  if (!["investigator", "admin"].includes(role)) {
    throw new ApiError("FORBIDDEN", "Case analytics is not available for this role");
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAuthorizedSession();
    assertAnalyticsRole(user.role);
    const input = await parseJsonBody(request as never, analyticsPresetShareSchema);
    await sharePreset(input.presetId, user.id, input.sharedWith);
    return apiSuccess({ shared: true });
  } catch (error) {
    return apiFailure(error);
  }
}
