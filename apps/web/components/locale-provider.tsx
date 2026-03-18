"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getLocaleMessages, normalizeLocaleCode, type LocaleCode } from "@vnexus/shared";
import { syncUserPreferences } from "../lib/client/user-preferences-api";

export const LOCALE_COOKIE_NAME = "vnexus_lang";

type LocaleContextValue = {
  locale: LocaleCode;
  setLocale: (nextLocale: LocaleCode) => void;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "ko",
  setLocale: () => {}
});

function schedulePreferenceSync(preferences: { locale?: LocaleCode; theme?: "light" | "dark" }, attempt = 0) {
  void syncUserPreferences(preferences).catch(() => {
    if (attempt >= 1 || typeof window === "undefined") {
      return;
    }

    window.setTimeout(() => {
      schedulePreferenceSync(preferences, attempt + 1);
    }, 1000);
  });
}

function readStoredLocale() {
  if (typeof window === "undefined") {
    return null;
  }

  const fromLocalStorage = window.localStorage.getItem(LOCALE_COOKIE_NAME);
  if (fromLocalStorage) {
    return normalizeLocaleCode(fromLocalStorage);
  }

  const cookieMatch = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${LOCALE_COOKIE_NAME}=`))
    ?.split("=")[1];

  return cookieMatch ? normalizeLocaleCode(cookieMatch) : null;
}

function persistLocale(nextLocale: LocaleCode) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCALE_COOKIE_NAME, nextLocale);
  document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = nextLocale;
}

export function LocaleProvider({ initialLocale = "ko", children }: { initialLocale?: LocaleCode; children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(normalizeLocaleCode(initialLocale));

  useEffect(() => {
    const storedLocale = readStoredLocale();

    if (storedLocale && storedLocale !== locale) {
      setLocaleState(storedLocale);
      document.documentElement.lang = storedLocale;
      return;
    }

    document.documentElement.lang = locale;
  }, []);

  const setLocale = (nextLocale: LocaleCode) => {
    const normalized = normalizeLocaleCode(nextLocale);
    setLocaleState(normalized);
    persistLocale(normalized);
    schedulePreferenceSync({ locale: normalized });
  };

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useLocaleMessages() {
  const { locale } = useLocale();
  return getLocaleMessages(locale);
}
