import { ApiError, isLocaleCode, messages, type LocaleCode } from "@vnexus/shared";

export function resolveReportLocale(langParam: string | null | undefined, acceptLanguage: string | null | undefined): LocaleCode {
  if (langParam) {
    if (!isLocaleCode(langParam)) {
      throw new ApiError("VALIDATION_ERROR", messages.en.uiInvalidLanguage);
    }

    return langParam;
  }

  const normalized = acceptLanguage?.toLowerCase() ?? "";

  if (normalized.startsWith("ko")) {
    return "ko";
  }

  return "en";
}
