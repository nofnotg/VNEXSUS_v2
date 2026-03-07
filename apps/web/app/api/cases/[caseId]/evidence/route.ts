import { NextRequest } from "next/server";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../../lib/server/api";
import { listEvidenceForCase } from "../../../../../lib/server/services/evidence-service";

type Context = {
  params: Promise<{ caseId: string }>;
};

export async function GET(_: NextRequest, context: Context) {
  try {
    const { caseId } = await context.params;
    const { user } = await requireAuthorizedSession();
    const evidence = await listEvidenceForCase(caseId, user.id, user.role);
    return apiSuccess(evidence);
  } catch (error) {
    return apiFailure(error);
  }
}
