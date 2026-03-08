import { NextRequest } from "next/server";
import { ApiError } from "@vnexus/shared";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../../../lib/server/api";
import { getInvestigatorReport } from "../../../../../../lib/server/services/investigator-report-service";

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

    const report = await getInvestigatorReport(caseId, user.id, user.role);
    return apiSuccess(report);
  } catch (error) {
    return apiFailure(error);
  }
}
