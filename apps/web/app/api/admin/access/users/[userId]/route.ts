import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, userStatuses } from "@vnexus/shared";
import { planCodes } from "../../../../../../lib/constants/plan-catalog";
import { apiFailure, apiSuccess, parseJsonBody, requireAuthorizedSession } from "../../../../../../lib/server/api";
import { updateManagedUserAccess } from "../../../../../../lib/server/services/admin-access-service";

const updateSchema = z.object({
  status: z.enum(userStatuses).optional(),
  planCode: z.enum(planCodes).nullable().optional()
});

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireAuthorizedSession();

    if (user.role !== "admin") {
      throw new ApiError("FORBIDDEN", "관리자만 접근할 수 있습니다.");
    }

    const input = await parseJsonBody(request, updateSchema);
    const { userId } = await context.params;

    await updateManagedUserAccess({
      userId,
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.planCode !== undefined ? { planCode: input.planCode } : {})
    });

    return apiSuccess({ ok: true });
  } catch (error) {
    return apiFailure(error);
  }
}
