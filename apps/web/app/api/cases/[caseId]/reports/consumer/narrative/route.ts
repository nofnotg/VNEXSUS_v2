import { NextRequest } from "next/server";
import { ApiError } from "@vnexus/shared";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../../../../lib/server/api";
import { getConsumerNarrative } from "../../../../../../../lib/server/services/consumer-narrative-service";

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

    const narrative = await getConsumerNarrative(caseId, user.id, user.role);
    return apiSuccess(narrative);
  } catch (error) {
    return apiFailure(error);
  }
}
