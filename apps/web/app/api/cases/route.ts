import { NextRequest } from "next/server";
import { caseCreateContract } from "@vnexus/domain";
import { apiFailure, apiSuccess, parseJsonBody, requireAuthorizedSession } from "../../../lib/server/api";
import { createCaseForUser, listCasesForUser } from "../../../lib/server/services/case-service";

export async function GET() {
  try {
    const { user } = await requireAuthorizedSession();
    const cases = await listCasesForUser(user.id, user.role);
    return apiSuccess({ items: cases });
  } catch (error) {
    return apiFailure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuthorizedSession();
    const input = await parseJsonBody(request, caseCreateContract);
    const created = await createCaseForUser(user.id, input);
    return apiSuccess(created, { status: 201 });
  } catch (error) {
    return apiFailure(error);
  }
}
