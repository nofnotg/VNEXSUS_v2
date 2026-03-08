import { NextRequest } from "next/server";
import { ApiError } from "@vnexus/shared";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../../../../lib/server/api";
import { getInvestigatorNarrative } from "../../../../../../../lib/server/services/investigator-narrative-service";

type Context = {
  params: Promise<{ caseId: string }>;
};

export async function GET(_: NextRequest, context: Context) {
  try {
    const { caseId } = await context.params;
    const { user } = await requireAuthorizedSession();

    if (user.role !== "investigator") {
      throw new ApiError("FORBIDDEN", "Investigator role is required");
    }

    const narrative = await getInvestigatorNarrative(caseId, user.id, user.role);
    return apiSuccess(narrative);
  } catch (error) {
    return apiFailure(error);
  }
}
