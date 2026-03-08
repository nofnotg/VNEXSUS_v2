import { ApiError, normalizeLocaleCode, messages, type LocaleCode } from "@vnexus/shared";
import { cookies, headers } from "next/headers";

export function resolveReportLocale(
  langParam: string | null | undefined,
  cookieLocale?: string | null | undefined,
  acceptLanguage?: string | null | undefined
): LocaleCode {
  if (langParam) {
    const normalizedParam = normalizeLocaleCode(langParam);
    if (normalizedParam !== langParam) {
      throw new ApiError("VALIDATION_ERROR", messages.en.uiInvalidLanguage);
    }

    return normalizedParam;
  }

  if (cookieLocale) {
    return normalizeLocaleCode(cookieLocale);
  }

  const normalized = acceptLanguage?.toLowerCase() ?? "";

  if (normalized.startsWith("ko")) {
    return "ko";
  }

  return "en";
}

export async function getRequestLocale() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  return resolveReportLocale(null, cookieStore.get("vnexus_lang")?.value, headerStore.get("accept-language"));
}
