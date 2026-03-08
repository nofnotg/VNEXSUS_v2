import React from "react";
import { getLocaleMessages } from "@vnexus/shared";
import { AppShell } from "../../components/app-shell";
import { getRequestLocale } from "../../lib/server/report-locale";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const locale = await getRequestLocale();
  const localeMessages = getLocaleMessages(locale);

  return (
    <AppShell heading={localeMessages.uiSettingsHeading} subheading={localeMessages.uiSettingsSubheading}>
      <SettingsClient />
    </AppShell>
  );
}
