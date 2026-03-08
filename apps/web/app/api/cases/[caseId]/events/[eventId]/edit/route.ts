import { z } from "zod";
import type { NextRequest } from "next/server";
import { apiFailure, apiSuccess, parseJsonBody, requireAuthorizedSession } from "../../../../../../../lib/server/api";
import { updateEventDetails } from "../../../../../../../lib/server/services/case-detail-service";

const editRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hospital: z.string().min(1).optional(),
  details: z.string().min(1).optional(),
  requiresReview: z.boolean().optional()
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ caseId: string; eventId: string }> }
) {
  try {
    const { user } = await requireAuthorizedSession();
    const { caseId, eventId } = await context.params;
    const input = await parseJsonBody(request, editRequestSchema);
    const event = await updateEventDetails(
      caseId,
      user.id,
      user.role,
      {
        eventId,
        ...input
      },
      request.headers.get("x-event-last-edited-at")
    );

    return apiSuccess(event);
  } catch (error) {
    return apiFailure(error);
  }
}
