import { NextRequest } from "next/server";
import { caseUpdateContract } from "@vnexus/domain";
import { apiFailure, apiSuccess, parseJsonBody, requireAuthorizedSession } from "../../../../lib/server/api";
import {
  deleteCaseForUser,
  getCaseForUser,
  updateCaseForUser
} from "../../../../lib/server/services/case-service";

type Context = {
  params: Promise<{ caseId: string }>;
};

export async function GET(_: NextRequest, context: Context) {
  try {
    const { caseId } = await context.params;
    const { user } = await requireAuthorizedSession();
    const item = await getCaseForUser(caseId, user.id, user.role);
    return apiSuccess(item);
  } catch (error) {
    return apiFailure(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { caseId } = await context.params;
    const { user } = await requireAuthorizedSession();
    const input = await parseJsonBody(request, caseUpdateContract);
    const updated = await updateCaseForUser(caseId, user.id, user.role, input);
    return apiSuccess(updated);
  } catch (error) {
    return apiFailure(error);
  }
}

export async function DELETE(_: NextRequest, context: Context) {
  try {
    const { caseId } = await context.params;
    const { user } = await requireAuthorizedSession();
    const result = await deleteCaseForUser(caseId, user.id, user.role);
    return apiSuccess(result);
  } catch (error) {
    return apiFailure(error);
  }
}
