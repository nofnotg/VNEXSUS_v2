import { NextRequest } from "next/server";
import { ApiError } from "@vnexus/shared";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../../../lib/server/api";
import { getConsumerReport } from "../../../../../../lib/server/services/consumer-report-service";

type Context = {
  params: Promise<{ caseId: string }>;
};

export async function GET(_: NextRequest, context: Context) {
  try {
    const { caseId } = await context.params;
    const { user } = await requireAuthorizedSession();

    if (user.role !== "consumer") {
      throw new ApiError("FORBIDDEN", "Consumer role is required");
    }

    const report = await getConsumerReport(caseId, user.id, user.role);
    return apiSuccess(report);
  } catch (error) {
    return apiFailure(error);
  }
}
