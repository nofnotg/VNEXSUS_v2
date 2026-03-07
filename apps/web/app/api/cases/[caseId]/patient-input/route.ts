import { NextRequest } from "next/server";
import { patientInputContract } from "@vnexus/domain";
import { apiFailure, apiSuccess, parseJsonBody, requireAuthorizedSession } from "../../../../../lib/server/api";
import { upsertPatientInput } from "../../../../../lib/server/services/case-service";

type Context = {
  params: Promise<{ caseId: string }>;
};

export async function PUT(request: NextRequest, context: Context) {
  try {
    const { caseId } = await context.params;
    const { user } = await requireAuthorizedSession();
    const input = await parseJsonBody(request, patientInputContract);
    const patientInput = await upsertPatientInput(caseId, user.id, user.role, input);
    return apiSuccess(patientInput);
  } catch (error) {
    return apiFailure(error);
  }
}
