import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError } from "@vnexus/shared";
import { planCodes } from "../../../../../../lib/constants/plan-catalog";
import { apiFailure, apiSuccess, parseJsonBody, requireAuthorizedSession } from "../../../../../../lib/server/api";
import {
  deletePendingInvestigatorRequest,
  reviewInvestigatorRequest
} from "../../../../../../lib/server/services/admin-access-service";

const reviewSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  planCode: z.enum(planCodes).optional().nullable()
});

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireAuthorizedSession();

    if (user.role !== "admin") {
      throw new ApiError("FORBIDDEN", "관리자만 접근할 수 있습니다.");
    }

    const input = await parseJsonBody(request, reviewSchema);
    const { userId } = await context.params;

    await reviewInvestigatorRequest({
      userId,
      decision: input.decision,
      planCode: input.planCode ?? null
    });

    return apiSuccess({ ok: true });
  } catch (error) {
    return apiFailure(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireAuthorizedSession();

    if (user.role !== "admin") {
      throw new ApiError("FORBIDDEN", "관리자만 접근할 수 있습니다.");
    }

    const { userId } = await context.params;
    await deletePendingInvestigatorRequest(userId);

    return apiSuccess({ ok: true });
  } catch (error) {
    return apiFailure(error);
  }
}
