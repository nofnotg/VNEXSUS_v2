import { NextRequest } from "next/server";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../../../lib/server/api";
import { listOcrBlocks } from "../../../../../../lib/server/services/job-service";

type Context = {
  params: Promise<{ caseId: string }>;
};

export async function GET(_: NextRequest, context: Context) {
  try {
    const { caseId } = await context.params;
    const { user } = await requireAuthorizedSession();
    const items = await listOcrBlocks(caseId, user.id, user.role);
    return apiSuccess({ items });
  } catch (error) {
    return apiFailure(error);
  }
}
