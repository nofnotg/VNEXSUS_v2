import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../lib/server/api";
import { getAdminAccessOverview } from "../../../../lib/server/services/admin-access-service";
import { ApiError } from "@vnexus/shared";

export async function GET() {
  try {
    const { user } = await requireAuthorizedSession();

    if (user.role !== "admin") {
      throw new ApiError("FORBIDDEN", "관리자만 접근할 수 있습니다.");
    }

    const overview = await getAdminAccessOverview();
    return apiSuccess(overview);
  } catch (error) {
    return apiFailure(error);
  }
}
