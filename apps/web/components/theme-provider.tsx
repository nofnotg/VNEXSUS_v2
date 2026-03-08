"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { syncUserPreferences } from "../lib/client/user-preferences-api";

export type ThemeMode = "light" | "dark";

export const THEME_COOKIE_NAME = "vnexus_theme";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (nextTheme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {}
});

function schedulePreferenceSync(preferences: { locale?: "en" | "ko"; theme?: ThemeMode }, attempt = 0) {
  void syncUserPreferences(preferences).catch(() => {
    if (attempt >= 1 || typeof window === "undefined") {
      return;
    }

    window.setTimeout(() => {
      schedulePreferenceSync(preferences, attempt + 1);
    }, 1000);
  });
}

function normalizeTheme(value: string | null | undefined): ThemeMode {
  return value === "dark" ? "dark" : "light";
}

function persistTheme(nextTheme: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_COOKIE_NAME, nextTheme);
  document.cookie = `${THEME_COOKIE_NAME}=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.dataset.theme = nextTheme;
}

function readStoredTheme() {
  if (typeof window === "undefined") {
    return null;
  }

  const fromLocalStorage = window.localStorage.getItem(THEME_COOKIE_NAME);
  if (fromLocalStorage) {
    return normalizeTheme(fromLocalStorage);
  }

  const cookieMatch = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${THEME_COOKIE_NAME}=`))
    ?.split("=")[1];

  return cookieMatch ? normalizeTheme(cookieMatch) : null;
}

export function ThemeProvider({ initialTheme = "light", children }: { initialTheme?: ThemeMode; children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(normalizeTheme(initialTheme));

  useEffect(() => {
    const storedTheme = readStoredTheme();

    if (storedTheme && storedTheme !== theme) {
      setThemeState(storedTheme);
      document.documentElement.dataset.theme = storedTheme;
      return;
    }

    document.documentElement.dataset.theme = theme;
  }, []);

  const setTheme = (nextTheme: ThemeMode) => {
    const normalized = normalizeTheme(nextTheme);
    setThemeState(normalized);
    persistTheme(normalized);
    schedulePreferenceSync({ theme: normalized });
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
