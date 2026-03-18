import { apiErrorEnvelopeSchema, apiSuccessEnvelopeSchema } from "@vnexus/shared";
import { z } from "zod";

const accountSettingsSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  region: z.string(),
  locale: z.enum(["en", "ko"]),
  theme: z.enum(["light", "dark"])
});

type AccountSettings = z.infer<typeof accountSettingsSchema>;

function buildErrorMessage(json: unknown, fallback: string) {
  const parsed = apiErrorEnvelopeSchema.safeParse(json);
  return parsed.success ? parsed.data.error.message : fallback;
}

function parseSettings(json: unknown) {
  const parsed = apiSuccessEnvelopeSchema(accountSettingsSchema).safeParse(json);
  if (!parsed.success) {
    throw new Error("설정 응답 형식이 올바르지 않습니다.");
  }

  return parsed.data.data;
}

export async function verifyAccountPassword(currentPassword: string): Promise<AccountSettings> {
  const response = await fetch("/api/user/account/verify", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ currentPassword })
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(buildErrorMessage(json, "비밀번호 확인에 실패했습니다."));
  }

  return parseSettings(json);
}

export async function updateAccountProfile(input: {
  currentPassword: string;
  phone: string;
  region: string;
  locale: "en" | "ko";
  theme: "light" | "dark";
  newPassword?: string;
  confirmPassword?: string;
}): Promise<AccountSettings> {
  const response = await fetch("/api/user/account", {
    method: "PUT",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(buildErrorMessage(json, "설정 저장에 실패했습니다."));
  }

  return parseSettings(json);
}
