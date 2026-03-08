import type { NextRequest } from "next/server";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../../lib/server/api";
import { getCaseDetail } from "../../../../../lib/server/services/case-detail-service";

export async function GET(_request: NextRequest, context: { params: Promise<{ caseId: string }> }) {
  try {
    const { user } = await requireAuthorizedSession();
    const { caseId } = await context.params;
    const detail = await getCaseDetail(caseId, user.id, user.role);
    return apiSuccess(detail);
  } catch (error) {
    return apiFailure(error);
  }
}
