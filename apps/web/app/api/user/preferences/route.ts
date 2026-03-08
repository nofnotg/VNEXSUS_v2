import { NextRequest } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess, parseJsonBody, requireAuthorizedSession } from "../../../../lib/server/api";
import { updateUserPreferences } from "../../../../lib/server/services/user-preferences-service";

const userPreferencesUpdateSchema = z.object({
  locale: z.enum(["en", "ko"]).optional(),
  theme: z.enum(["light", "dark"]).optional()
});

export async function PUT(request: NextRequest) {
  try {
    const { user } = await requireAuthorizedSession();
    const input = await parseJsonBody(request, userPreferencesUpdateSchema);
    const prefs = await updateUserPreferences(user.id, {
      ...(input.locale !== undefined ? { locale: input.locale } : {}),
      ...(input.theme !== undefined ? { theme: input.theme } : {})
    });
    return apiSuccess(prefs);
  } catch (error) {
    return apiFailure(error);
  }
}
