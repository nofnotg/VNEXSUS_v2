import { NextRequest } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess, parseJsonBody, requireAuthorizedSession } from "../../../../../lib/server/api";
import { verifyAccountAccess } from "../../../../../lib/server/services/account-settings-service";

const verifySchema = z.object({
  currentPassword: z.string().min(4)
});

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuthorizedSession();
    const input = await parseJsonBody(request, verifySchema);
    const settings = await verifyAccountAccess(user.id, user.email, input.currentPassword);
    return apiSuccess(settings);
  } catch (error) {
    return apiFailure(error);
  }
}
