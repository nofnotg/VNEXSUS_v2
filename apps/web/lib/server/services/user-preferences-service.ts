import { ApiError, normalizeLocaleCode, type LocaleCode } from "@vnexus/shared";
import { userPreferencesRepository } from "../data-access/user-preferences-repository";
import { getSessionUser } from "../../session";
import { isLocalDemoMode } from "../demo-mode";
import { getDemoUserPreferences, updateDemoUserPreferences } from "../demo-store";

export type ThemeCode = "light" | "dark";
export type UserPreferences = {
  locale: LocaleCode;
  theme: ThemeCode;
};

function normalizeTheme(value: string | null | undefined): ThemeCode {
  return value === "dark" ? "dark" : "light";
}

export async function getUserPreferences(
  userId: string,
  repository: Pick<typeof userPreferencesRepository, "findProfile"> = userPreferencesRepository
): Promise<UserPreferences> {
  if (isLocalDemoMode()) {
    const sessionUser = await getSessionUser();
    return getDemoUserPreferences(userId, sessionUser?.email);
  }

  const profile = await repository.findProfile(userId);

  return {
    locale: normalizeLocaleCode(profile?.locale),
    theme: normalizeTheme(profile?.theme)
  };
}

export async function updateUserPreferences(
  userId: string,
  prefs: { locale?: LocaleCode; theme?: ThemeCode },
  repository: Pick<typeof userPreferencesRepository, "upsertProfilePreferences"> = userPreferencesRepository
): Promise<UserPreferences> {
  if (prefs.locale !== undefined && prefs.locale !== normalizeLocaleCode(prefs.locale)) {
    throw new ApiError("VALIDATION_ERROR", "Invalid locale value");
  }

  if (prefs.theme !== undefined && prefs.theme !== normalizeTheme(prefs.theme)) {
    throw new ApiError("VALIDATION_ERROR", "Invalid theme value");
  }

  const nextLocale = prefs.locale !== undefined ? prefs.locale : undefined;
  const nextTheme = prefs.theme !== undefined ? prefs.theme : undefined;

  if (isLocalDemoMode()) {
    const sessionUser = await getSessionUser();
    return updateDemoUserPreferences(userId, sessionUser?.email ?? `${userId}@vnexus.local`, {
      ...(nextLocale !== undefined ? { locale: nextLocale } : {}),
      ...(nextTheme !== undefined ? { theme: nextTheme } : {})
    });
  }

  const updated = await repository.upsertProfilePreferences(userId, nextLocale, nextTheme);

  return {
    locale: normalizeLocaleCode(updated.locale),
    theme: normalizeTheme(updated.theme)
  };
}
