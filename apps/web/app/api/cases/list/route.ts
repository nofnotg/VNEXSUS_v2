import { ApiError } from "@vnexus/shared";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../lib/server/api";
import { getCaseList } from "../../../../lib/server/services/case-list-service";

export async function GET() {
  try {
    const { user } = await requireAuthorizedSession();

    if (!["consumer", "investigator", "admin"].includes(user.role)) {
      throw new ApiError("FORBIDDEN", "Case list is not available for this role");
    }

    const items = await getCaseList(user.id, user.role);
    return apiSuccess(items);
  } catch (error) {
    return apiFailure(error);
  }
}
