import React from "react";
import { redirect } from "next/navigation";
import { getLocaleMessages } from "@vnexus/shared";
import { AppShell } from "../../components/app-shell";
import { getRequestLocale } from "../../lib/server/report-locale";
import { getSessionUser } from "../../lib/session";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const user = await getSessionUser();
  const locale = await getRequestLocale();
  const localeMessages = getLocaleMessages(locale);

  if (!user) {
    redirect("/");
  }

  return (
    <AppShell heading={localeMessages.uiSettingsHeading} subheading={localeMessages.uiSettingsSubheading}>
      <SettingsClient />
    </AppShell>
  );
}
