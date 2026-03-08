"use client";

import React from "react";
import { useEffect, useState } from "react";
import { getLocaleMessages, type LocaleCode } from "@vnexus/shared";
import { useLocale, useLocaleMessages } from "../../components/locale-provider";
import { useTheme, type ThemeMode } from "../../components/theme-provider";
import { syncUserPreferences } from "../../lib/client/user-preferences-api";

export function SettingsClient() {
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const localeMessages = useLocaleMessages();
  const [nextLocale, setNextLocale] = useState<LocaleCode>(locale);
  const [nextTheme, setNextTheme] = useState<ThemeMode>(theme);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setNextLocale(locale);
  }, [locale]);

  useEffect(() => {
    setNextTheme(theme);
  }, [theme]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setLocale(nextLocale);
        setTheme(nextTheme);
        void syncUserPreferences({ locale: nextLocale, theme: nextTheme });
        setSavedMessage(getLocaleMessages(nextLocale).uiSettingsSaved);
      }}
      style={{ display: "grid", gap: "20px", maxWidth: "520px" }}
    >
      <label style={{ display: "grid", gap: "8px" }}>
        <span>{localeMessages.uiLanguageOption}</span>
        <select
          aria-label={localeMessages.uiLanguageOption}
          value={nextLocale}
          onChange={(event) => setNextLocale(event.target.value as LocaleCode)}
        >
          <option value="en">{localeMessages.uiLanguageEnglish}</option>
          <option value="ko">{localeMessages.uiLanguageKorean}</option>
        </select>
      </label>

      <label style={{ display: "grid", gap: "8px" }}>
        <span>{localeMessages.uiThemeOption}</span>
        <select
          aria-label={localeMessages.uiThemeOption}
          value={nextTheme}
          onChange={(event) => setNextTheme(event.target.value as ThemeMode)}
        >
          <option value="light">{localeMessages.uiThemeLight}</option>
          <option value="dark">{localeMessages.uiThemeDark}</option>
        </select>
      </label>

      <button
        type="submit"
        style={{
          width: "fit-content",
          padding: "10px 16px",
          borderRadius: "999px",
          border: "1px solid var(--border)",
          background: "var(--accent)",
          color: "var(--accent-foreground)",
          fontWeight: 600
        }}
      >
        {localeMessages.uiSaveSettings}
      </button>

      {savedMessage ? <p style={{ margin: 0, color: "var(--muted)" }}>{savedMessage}</p> : null}
    </form>
  );
}
