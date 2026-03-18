import { NextRequest } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess, parseJsonBody, requireAuthorizedSession } from "../../../../lib/server/api";
import { getAccountSettings, updateAccountSettings } from "../../../../lib/server/services/account-settings-service";

const updateAccountSchema = z
  .object({
    currentPassword: z.string().min(4),
    phone: z.string().optional(),
    region: z.string().optional(),
    locale: z.enum(["en", "ko"]).optional(),
    theme: z.enum(["light", "dark"]).optional(),
    newPassword: z.string().min(8).optional(),
    confirmPassword: z.string().optional()
  })
  .superRefine((value, ctx) => {
    if (value.newPassword && value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "비밀번호 확인이 일치하지 않습니다."
      });
    }
  });

export async function GET() {
  try {
    const { user } = await requireAuthorizedSession();
    const settings = await getAccountSettings(user.id, user.email);
    return apiSuccess(settings);
  } catch (error) {
    return apiFailure(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await requireAuthorizedSession();
    const input = await parseJsonBody(request, updateAccountSchema);
    const settings = await updateAccountSettings(user.id, user.email, {
      currentPassword: input.currentPassword,
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.region !== undefined ? { region: input.region } : {}),
      ...(input.locale !== undefined ? { locale: input.locale } : {}),
      ...(input.theme !== undefined ? { theme: input.theme } : {}),
      ...(input.newPassword !== undefined ? { newPassword: input.newPassword } : {})
    });
    return apiSuccess(settings);
  } catch (error) {
    return apiFailure(error);
  }
}
