import { NextRequest } from "next/server";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../lib/server/api";
import { getJob } from "../../../../lib/server/services/job-service";

type Context = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_: NextRequest, context: Context) {
  try {
    const { jobId } = await context.params;
    const { user } = await requireAuthorizedSession();
    const job = await getJob(jobId, user.id, user.role);
    return apiSuccess(job);
  } catch (error) {
    return apiFailure(error);
  }
}
