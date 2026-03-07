import { NextRequest } from "next/server";
import { ocrJobCreateContract } from "@vnexus/domain";
import { apiFailure, apiSuccess, parseJsonBody, requireAuthorizedSession } from "../../../../../../lib/server/api";
import { createOcrJob } from "../../../../../../lib/server/services/job-service";

type Context = {
  params: Promise<{ caseId: string }>;
};

export async function POST(request: NextRequest, context: Context) {
  try {
    const { caseId } = await context.params;
    const { user } = await requireAuthorizedSession();
    const input = await parseJsonBody(request, ocrJobCreateContract);
    const job = await createOcrJob(caseId, user.id, user.role, input);
    return apiSuccess(job, { status: 202 });
  } catch (error) {
    return apiFailure(error);
  }
}
