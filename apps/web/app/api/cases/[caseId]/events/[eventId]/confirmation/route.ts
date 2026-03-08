import { z } from "zod";
import type { NextRequest } from "next/server";
import { apiFailure, apiSuccess, parseJsonBody, requireAuthorizedSession } from "../../../../../../../lib/server/api";
import { updateEventConfirmation } from "../../../../../../../lib/server/services/case-detail-service";

const confirmationUpdateSchema = z.object({
  confirmed: z.boolean()
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ caseId: string; eventId: string }> }
) {
  try {
    const { user } = await requireAuthorizedSession();
    const { caseId, eventId } = await context.params;
    const input = await parseJsonBody(request, confirmationUpdateSchema);
    await updateEventConfirmation(caseId, eventId, input.confirmed, user.id, user.role);
    return apiSuccess({ caseId, eventId, confirmed: input.confirmed });
  } catch (error) {
    return apiFailure(error);
  }
}
