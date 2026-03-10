import { ApiError } from "@vnexus/shared";
import { z } from "zod";
import { apiFailure, apiSuccess, parseJsonBody, requireAuthorizedSession } from "../../../../../lib/server/api";
import { createPreset, deletePreset, getPresetsForUser } from "../../../../../lib/server/services/analytics-preset-service";

const analyticsPresetCreateSchema = z.object({
  name: z.string().min(1),
  filter: z.record(z.string(), z.unknown()).default({}),
  interval: z.enum(["daily", "weekly", "monthly"])
});

function assertAnalyticsRole(role: string) {
  if (!["investigator", "admin"].includes(role)) {
    throw new ApiError("FORBIDDEN", "Case analytics is not available for this role");
  }
}

export async function GET() {
  try {
    const { user } = await requireAuthorizedSession();
    assertAnalyticsRole(user.role);
    const presets = await getPresetsForUser(user.id);
    return apiSuccess({ items: presets });
  } catch (error) {
    return apiFailure(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAuthorizedSession();
    assertAnalyticsRole(user.role);
    const input = await parseJsonBody(request as never, analyticsPresetCreateSchema);
    const preset = await createPreset(user.id, input);
    return apiSuccess(preset, { status: 201 });
  } catch (error) {
    return apiFailure(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { user } = await requireAuthorizedSession();
    assertAnalyticsRole(user.role);

    const presetId = new URL(request.url).searchParams.get("presetId");
    if (!presetId) {
      throw new ApiError("VALIDATION_ERROR", "presetId is required");
    }

    await deletePreset(user.id, presetId);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiFailure(error);
  }
}
